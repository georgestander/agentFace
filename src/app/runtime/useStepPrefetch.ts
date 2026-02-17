"use client";

/**
 * useStepPrefetch — prefetches upcoming steps after an interactive step completes.
 *
 * After step N arrives, enqueues N+1..last in order.
 * - Concurrency = 2 (default), adaptive: drops to 1 on background/weak network.
 * - Cancelable on unmount or session change.
 * - Skips cached or in-flight steps.
 * - Paused when tab is hidden.
 */

import { useEffect, useRef, useCallback } from "react";
import { type StepPacket, type TokenUsage, PROMPT_VERSION, UI_MOODS, type UiMood } from "./types";
import { CONCEPTS } from "../agent/concepts";
import { hasPacket, isInflight, storePacket, markInflight, clearInflight } from "./thread-store";
import { acquireLock, releaseStepLock, broadcastPacketReady } from "./tab-sync";
import { buildSeed, deriveMood, deriveIntent } from "./seed";
import { getPacket as getThreadPacket } from "./thread-store";

interface PrefetchConfig {
  sessionId: string;
  model: string;
  /** Step that just completed (prefetch starts from completedStep + 1) */
  completedStep: number;
  /** Total concepts in the session */
  totalConcepts: number;
  /** Whether prefetch is enabled */
  enabled: boolean;
}

const DEFAULT_CONCURRENCY = 2;
const BACKGROUND_CONCURRENCY = 1;

export function useStepPrefetch(config: PrefetchConfig): void {
  const { sessionId, model, completedStep, totalConcepts, enabled } = config;
  const abortRef = useRef<AbortController | null>(null);
  const isRunning = useRef(false);

  const getConcurrency = useCallback((): number => {
    if (typeof document !== "undefined" && document.hidden) {
      return BACKGROUND_CONCURRENCY;
    }
    // Check for slow connection
    const nav = typeof navigator !== "undefined" ? navigator : null;
    const conn = (nav as any)?.connection;
    if (conn && (conn.saveData || conn.effectiveType === "slow-2g" || conn.effectiveType === "2g")) {
      return BACKGROUND_CONCURRENCY;
    }
    return DEFAULT_CONCURRENCY;
  }, []);

  const prefetchStep = useCallback(
    async (stepIndex: number, signal: AbortSignal): Promise<boolean> => {
      // Skip if already cached or in-flight
      if (hasPacket(stepIndex) || isInflight(stepIndex)) return true;

      // Try to acquire lock
      if (!acquireLock(sessionId, stepIndex)) return false;

      markInflight(stepIndex);

      try {
        // Build prior steps from what we have
        const priorSteps: number[] = [];
        const usedTools: string[] = [];
        for (let i = 0; i < stepIndex; i++) {
          const p = getThreadPacket(i);
          if (p) {
            priorSteps.push(i);
            usedTools.push(p.toolName);
          }
        }

        const response = await fetch("/api/session/step", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            stepIndex,
            mode: "prefetch",
            priorSteps,
            usedTools,
          }),
          signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Prefetch failed: ${response.status}`);
        }

        // Read the SSE stream (same format as interactive)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let reasoning = "";
        let receivedPacket: StepPacket | null = null;
        let receivedUsage: TokenUsage | null = null;
        let currentEvent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (signal.aborted) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("event: ")) {
              currentEvent = trimmed.slice(7).trim();
              continue;
            }
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(trimmed.slice(6).trim());
              switch (currentEvent) {
                case "thought_delta":
                  reasoning += data.delta || "";
                  break;
                case "packet":
                  receivedPacket = data as StepPacket;
                  break;
                case "usage":
                  receivedUsage = data as TokenUsage;
                  break;
              }
            } catch {
              // Ignore parse errors
            }
            currentEvent = "";
          }
        }

        if (!receivedPacket || signal.aborted) {
          clearInflight(stepIndex);
          releaseStepLock(sessionId, stepIndex);
          return false;
        }

        // Enrich with client-derived metadata (same merge logic as useShowSession)
        const concept = CONCEPTS[stepIndex];
        const seed = buildSeed(sessionId, stepIndex, concept.id, PROMPT_VERSION, model);
        const previousPacket = getThreadPacket(stepIndex - 1);
        const seedMood = deriveMood(seed, previousPacket?.uiMood);
        const seedIntent = deriveIntent(seed);

        // Validate model-provided mood against known values
        const modelMood = receivedPacket.uiMood;
        const validMood = modelMood && (UI_MOODS as readonly string[]).includes(modelMood)
          ? (modelMood as UiMood)
          : seedMood;

        // Merge model-provided intent label with seed-derived defaults
        const modelIntent = receivedPacket.intentSpec;
        const mergedIntent = modelIntent?.label
          ? { ...seedIntent, label: modelIntent.label }
          : seedIntent;

        const enrichedPacket: StepPacket = {
          ...receivedPacket,
          thoughtFull: reasoning,
          thoughtShort: reasoning.slice(0, 120),
          uiMood: validMood,
          intentSpec: mergedIntent,
          tokenUsage: receivedUsage || receivedPacket.tokenUsage,
        };

        storePacket(enrichedPacket);
        releaseStepLock(sessionId, stepIndex);
        broadcastPacketReady(sessionId, stepIndex, enrichedPacket);
        return true;
      } catch (err) {
        if (signal.aborted) return false;
        console.warn(`[prefetch] Step ${stepIndex} failed:`, err);
        clearInflight(stepIndex);
        releaseStepLock(sessionId, stepIndex);
        return false;
      }
    },
    [sessionId, model]
  );

  useEffect(() => {
    if (!enabled || !sessionId || completedStep < 0) return;

    // Cancel any in-progress prefetch
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const run = async () => {
      if (isRunning.current) return;
      isRunning.current = true;

      // Build queue: all steps after completedStep that aren't cached
      const queue: number[] = [];
      for (let i = completedStep + 1; i < totalConcepts; i++) {
        if (!hasPacket(i) && !isInflight(i)) {
          queue.push(i);
        }
      }

      // Process with adaptive concurrency
      let i = 0;
      while (i < queue.length && !controller.signal.aborted) {
        // Pause if tab is hidden
        if (typeof document !== "undefined" && document.hidden) {
          await new Promise<void>((resolve) => {
            const handler = () => {
              if (!document.hidden) {
                document.removeEventListener("visibilitychange", handler);
                resolve();
              }
            };
            document.addEventListener("visibilitychange", handler);
          });
        }

        const concurrency = getConcurrency();
        const batch = queue.slice(i, i + concurrency);
        await Promise.all(
          batch.map((step) => prefetchStep(step, controller.signal))
        );
        i += batch.length;
      }

      isRunning.current = false;
    };

    run();

    return () => {
      controller.abort();
      isRunning.current = false;
    };
  }, [enabled, sessionId, completedStep, totalConcepts, prefetchStep, getConcurrency]);
}
