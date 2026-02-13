"use client";

/**
 * useShowSession — main session orchestration hook.
 *
 * Coordinates the full v3 session lifecycle:
 * 1. Start session (get sessionId + metadata)
 * 2. Request steps (check cache first → zero inference on replay)
 * 3. Handle SSE streaming for live steps
 * 4. Store packets in thread store + localStorage
 * 5. Trigger prefetch after interactive steps complete
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { type StepPacket, type TokenUsage, PROMPT_VERSION } from "./types";
import { CONCEPTS } from "../agent/concepts";
import {
  generateSessionId,
  loadSession,
  cleanExpiredSessions,
} from "./session-store";
import {
  initThread,
  destroyThread,
  hasPacket,
  getPacket,
  storePacket,
  markInflight,
  clearInflight,
  setCurrentStep,
} from "./thread-store";
import {
  acquireLock,
  releaseStepLock,
  broadcastPacketReady,
  onSyncMessage,
  destroyTabSync,
} from "./tab-sync";
import { buildSeed, deriveMood, deriveIntent } from "./seed";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SessionPhase =
  | "init"
  | "idle"
  | "reasoning"
  | "reasoning-done"
  | "presenting"
  | "awaiting"
  | "complete"
  | "error";

export interface ShowSessionState {
  sessionId: string;
  phase: SessionPhase;
  currentStep: number;
  totalConcepts: number;
  model: string;

  /** Current step's packet (if available) */
  currentPacket: StepPacket | null;
  /** Live-streaming thought delta (before packet is complete) */
  thoughtDelta: string;
  /** Error message if phase === "error" */
  errorMessage: string;

  /** History browsing index (null = viewing current) */
  browsingIndex: number | null;
}

export interface ShowSessionActions {
  /** Start the session (called once on mount) */
  startSession: () => Promise<void>;
  /** Request a specific step (checks cache, falls back to API) */
  requestStep: (stepIndex: number) => Promise<void>;
  /** Visitor clicked "show me" */
  showPresentation: () => void;
  /** Presentation finished rendering */
  finishPresentation: () => void;
  /** Advance to next concept */
  advance: () => void;
  /** Go back in history */
  goBack: () => void;
  /** Go forward in history */
  goForward: () => void;
  /** Browse to a specific history index */
  browseTo: (index: number) => void;
  /** Clear error and retry */
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useShowSession(): ShowSessionState & ShowSessionActions {
  const [state, setState] = useState<ShowSessionState>({
    sessionId: "",
    phase: "init",
    currentStep: 0,
    totalConcepts: CONCEPTS.length,
    model: "",
    currentPacket: null,
    thoughtDelta: "",
    errorMessage: "",
    browsingIndex: null,
  });

  const isRequesting = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Track all completed packets for history browsing
  const packetsRef = useRef<Record<number, StepPacket>>({});

  // ---------------------------------------------------------------------------
  // Session lifecycle
  // ---------------------------------------------------------------------------

  const startSession = useCallback(async () => {
    cleanExpiredSessions();

    try {
      const response = await fetch("/api/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptVersion: PROMPT_VERSION }),
      });

      if (!response.ok) {
        throw new Error(`Session start failed: ${response.status}`);
      }

      const data = await response.json();
      const { sessionId, totalConcepts } = data;
      const model = data.cacheVersion?.split(":")?.[0] || "";

      // Init thread store (hydrates from localStorage)
      initThread(sessionId, model, PROMPT_VERSION);

      // Restore any cached packets
      const persisted = loadSession(sessionId, model, PROMPT_VERSION);
      if (persisted?.packets) {
        packetsRef.current = { ...persisted.packets };
      }

      setState((s) => ({
        ...s,
        sessionId,
        totalConcepts,
        model,
        phase: "idle",
      }));
    } catch (err) {
      console.error("[useShowSession] startSession error:", err);
      setState((s) => ({
        ...s,
        phase: "error",
        errorMessage: "Failed to start session",
      }));
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Step request (cache-first, then SSE)
  // ---------------------------------------------------------------------------

  const requestStep = useCallback(async (stepIndex: number) => {
    if (isRequesting.current) return;

    const s = stateRef.current;

    // Cache hit — zero inference
    const cached = getPacket(stepIndex);
    if (cached) {
      packetsRef.current[stepIndex] = cached;
      setCurrentStep(stepIndex);
      setState((prev) => ({
        ...prev,
        currentStep: stepIndex,
        currentPacket: cached,
        thoughtDelta: cached.thoughtFull,
        phase: "reasoning-done",
        browsingIndex: null,
      }));
      return;
    }

    // Tab lock — prevent duplicate generation
    if (!acquireLock(s.sessionId, stepIndex)) {
      // Another tab is generating this step — wait for broadcast
      return;
    }

    isRequesting.current = true;
    markInflight(stepIndex);
    setCurrentStep(stepIndex);

    setState((prev) => ({
      ...prev,
      currentStep: stepIndex,
      currentPacket: null,
      thoughtDelta: "",
      phase: "reasoning",
      browsingIndex: null,
    }));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      // Build prior steps list
      const priorSteps: number[] = [];
      const usedTools: string[] = [];
      for (let i = 0; i < stepIndex; i++) {
        if (packetsRef.current[i]) {
          priorSteps.push(i);
          usedTools.push(packetsRef.current[i].toolName);
        }
      }

      const response = await fetch("/api/session/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: s.sessionId,
          stepIndex,
          mode: "interactive",
          priorSteps,
          usedTools,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Step request failed: ${response.status}`);
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let reasoning = "";
      let receivedPacket: StepPacket | null = null;
      let receivedUsage: TokenUsage | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("event: ")) {
            currentEvent = trimmed.slice(7).trim();
            continue;
          }
          if (!trimmed.startsWith("data: ")) continue;

          const dataStr = trimmed.slice(6).trim();
          try {
            const data = JSON.parse(dataStr);

            switch (currentEvent) {
              case "thought_delta":
                reasoning += data.delta || "";
                setState((prev) => ({
                  ...prev,
                  thoughtDelta: reasoning,
                }));
                break;

              case "packet":
                receivedPacket = data as StepPacket;
                break;

              case "usage":
                receivedUsage = data as TokenUsage;
                break;

              case "status":
                if (data.phase === "error") {
                  throw new Error("Server reported generation error");
                }
                break;
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message === "Server reported generation error") {
              throw parseErr;
            }
            // Ignore individual line parse errors
          }
          currentEvent = "";
        }
      }

      if (!receivedPacket) {
        throw new Error("No packet received from step endpoint");
      }

      // Enrich packet with client-derived mood/intent and usage
      const concept = CONCEPTS[stepIndex];
      const seed = buildSeed(s.sessionId, stepIndex, concept.id, PROMPT_VERSION, s.model);
      const previousMood = stepIndex > 0 ? packetsRef.current[stepIndex - 1]?.uiMood : undefined;

      const enrichedPacket: StepPacket = {
        ...receivedPacket,
        thoughtFull: reasoning,
        thoughtShort: reasoning.slice(0, 120),
        uiMood: receivedPacket.uiMood || deriveMood(seed, previousMood),
        intentSpec: receivedPacket.intentSpec || deriveIntent(seed),
        tokenUsage: receivedUsage || receivedPacket.tokenUsage,
      };

      // Store in thread store + localStorage
      storePacket(enrichedPacket);
      packetsRef.current[stepIndex] = enrichedPacket;

      // Release lock and broadcast
      releaseStepLock(s.sessionId, stepIndex);
      broadcastPacketReady(s.sessionId, stepIndex, enrichedPacket);

      setState((prev) => ({
        ...prev,
        currentPacket: enrichedPacket,
        thoughtDelta: reasoning,
        phase: "reasoning-done",
      }));
    } catch (err) {
      console.error("[useShowSession] requestStep error:", err);
      clearInflight(stepIndex);
      releaseStepLock(s.sessionId, stepIndex);

      if (err instanceof DOMException && err.name === "AbortError") {
        setState((prev) => ({
          ...prev,
          phase: "error",
          errorMessage: "The agent took too long to respond. Let's try again.",
        }));
      } else {
        setState((prev) => ({
          ...prev,
          phase: "error",
          errorMessage: "Something went wrong. The agent stumbled.",
        }));
      }
    } finally {
      clearTimeout(timeoutId);
      isRequesting.current = false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Navigation actions
  // ---------------------------------------------------------------------------

  const showPresentation = useCallback(() => {
    setState((s) => ({ ...s, phase: "presenting" }));
  }, []);

  const finishPresentation = useCallback(() => {
    setState((s) => ({ ...s, phase: "awaiting" }));
  }, []);

  const advance = useCallback(() => {
    setState((s) => {
      if (s.browsingIndex !== null) {
        return { ...s, browsingIndex: null };
      }

      const nextStep = s.currentStep + 1;
      if (nextStep >= s.totalConcepts) {
        return { ...s, phase: "complete" };
      }

      return {
        ...s,
        currentStep: nextStep,
        currentPacket: null,
        thoughtDelta: "",
        phase: "idle",
        browsingIndex: null,
      };
    });
  }, []);

  const goBack = useCallback(() => {
    setState((s) => {
      const completedSteps = Object.keys(packetsRef.current)
        .map(Number)
        .filter((i) => i < s.currentStep)
        .sort((a, b) => a - b);

      if (completedSteps.length === 0) return s;

      if (s.browsingIndex === null) {
        // Go to the most recent completed step before current
        const lastCompleted = completedSteps[completedSteps.length - 1];
        return {
          ...s,
          browsingIndex: lastCompleted,
          currentPacket: packetsRef.current[lastCompleted] || null,
        };
      }

      // Find previous completed step
      const prevSteps = completedSteps.filter((i) => i < s.browsingIndex!);
      if (prevSteps.length === 0) return s;

      const prev = prevSteps[prevSteps.length - 1];
      return {
        ...s,
        browsingIndex: prev,
        currentPacket: packetsRef.current[prev] || null,
      };
    });
  }, []);

  const goForward = useCallback(() => {
    setState((s) => {
      if (s.browsingIndex === null) return s;

      const completedSteps = Object.keys(packetsRef.current)
        .map(Number)
        .sort((a, b) => a - b);

      const nextSteps = completedSteps.filter((i) => i > s.browsingIndex!);

      if (nextSteps.length === 0 || nextSteps[0] >= s.currentStep) {
        // Return to current
        return {
          ...s,
          browsingIndex: null,
          currentPacket: packetsRef.current[s.currentStep] || null,
        };
      }

      const next = nextSteps[0];
      return {
        ...s,
        browsingIndex: next,
        currentPacket: packetsRef.current[next] || null,
      };
    });
  }, []);

  const browseTo = useCallback((index: number) => {
    setState((s) => {
      const packet = packetsRef.current[index];
      if (!packet) return s;
      return {
        ...s,
        browsingIndex: index,
        currentPacket: packet,
      };
    });
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({
      ...s,
      phase: "idle",
      errorMessage: "",
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Auto-request step when phase becomes idle
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (state.phase === "idle" && state.sessionId && state.currentStep < state.totalConcepts) {
      requestStep(state.currentStep);
    }
  }, [state.phase, state.currentStep, state.sessionId, state.totalConcepts, requestStep]);

  // ---------------------------------------------------------------------------
  // Cross-tab sync: listen for packets from other tabs
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!state.sessionId) return;

    const unsub = onSyncMessage((msg) => {
      if (msg.type === "packet-ready" && msg.sessionId === state.sessionId) {
        // Another tab completed a step — store it locally
        storePacket(msg.packet);
        packetsRef.current[msg.stepIndex] = msg.packet;

        // If this was the step we're waiting for, render it
        if (msg.stepIndex === stateRef.current.currentStep && stateRef.current.phase === "reasoning") {
          setState((prev) => ({
            ...prev,
            currentPacket: msg.packet,
            thoughtDelta: msg.packet.thoughtFull,
            phase: "reasoning-done",
          }));
        }
      }
    });

    return unsub;
  }, [state.sessionId]);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      destroyThread();
      destroyTabSync();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Presenting safety timeout
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (state.phase === "presenting") {
      const timer = setTimeout(() => {
        setState((s) => ({ ...s, phase: "awaiting" }));
      }, 15_000);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  return {
    ...state,
    startSession,
    requestStep,
    showPresentation,
    finishPresentation,
    advance,
    goBack,
    goForward,
    browseTo,
    clearError,
  };
}
