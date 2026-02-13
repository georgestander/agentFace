"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePerformance } from "../context/PerformanceContext";
import {
  createStreamState,
  processSSELine,
  validateToolCall,
  type StreamState,
} from "../agent/parse-stream";
import ReasoningTrace from "./ReasoningTrace";
import ToolRenderer from "./ToolRenderer";
import NavigationControls from "./NavigationControls";

/** Safety timeout for presenting phase — if onReady never fires */
const PRESENTING_TIMEOUT_MS = 15_000;
/** Timeout for the fetch request to /api/perform */
const FETCH_TIMEOUT_MS = 30_000;

export default function Stage() {
  const {
    phase,
    currentConceptIndex,
    reasoning,
    currentPresentation,
    errorMessage,
    history,
    browsingIndex,
    startReasoning,
    updateReasoning,
    present,
    finishPresentation,
    setError,
    clearError,
    totalConcepts,
  } = usePerformance();

  const isPerforming = useRef(false);

  // Use refs for values that perform() needs so the callback
  // doesn't go stale across state transitions
  const historyRef = useRef(history);
  const conceptIndexRef = useRef(currentConceptIndex);
  historyRef.current = history;
  conceptIndexRef.current = currentConceptIndex;

  /**
   * Trigger the agent to perform the current concept.
   * Reads from refs to always get the latest state values.
   */
  const perform = useCallback(async () => {
    if (isPerforming.current) return;
    isPerforming.current = true;
    startReasoning();

    // AbortController for fetch timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      // Read latest values from refs
      const currentHistory = historyRef.current;
      const currentIndex = conceptIndexRef.current;

      // Build message history from previous turns
      const messages: Array<Record<string, unknown>> = [];
      for (const entry of currentHistory) {
        // Assistant turn with tool call
        messages.push({
          role: "assistant",
          content: entry.reasoning || null,
          tool_calls: [
            {
              id: entry.toolCallId,
              type: "function",
              function: {
                name: entry.toolName,
                arguments: JSON.stringify(entry.props),
              },
            },
          ],
        });
        // Tool result (required by OpenRouter for multi-turn)
        messages.push({
          role: "tool",
          tool_call_id: entry.toolCallId,
          content: JSON.stringify({ rendered: true }),
        });
      }

      const response = await fetch("/api/perform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages,
          conceptIndex: currentIndex,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status}`);
      }

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let state: StreamState = createStreamState();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          state = processSSELine(line, state);
          // Update reasoning text in real-time
          if (state.reasoning) {
            updateReasoning(state.reasoning);
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        state = processSSELine(buffer, state);
      }

      // Stream done — validate tool call and transition to reasoning-done
      // (the visitor clicks "show me" to proceed to presenting)
      if (state.toolCalls.length > 0) {
        const result = validateToolCall(state.toolCalls[0]);
        if (result.valid) {
          present(result.name, result.props, state.toolCalls[0].id);
        } else {
          console.error("[Stage] Tool validation failed:", result.error);
          setError("The agent's response wasn't quite right. Let's try again.");
        }
      } else {
        // No tool call received — the agent didn't call a tool
        console.error("[Stage] No tool call in response");
        setError("The agent forgot to present. Let's try again.");
      }
    } catch (err) {
      console.error("[Stage] Performance error:", err);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("The agent took too long to respond. Let's try again.");
      } else {
        setError("Something went wrong. The agent stumbled.");
      }
    } finally {
      clearTimeout(timeoutId);
      isPerforming.current = false;
    }
  }, [startReasoning, updateReasoning, present, setError]);

  // Auto-trigger performance when phase becomes idle (and we have concepts left)
  useEffect(() => {
    if (phase === "idle" && currentConceptIndex < totalConcepts) {
      perform();
    }
  }, [phase, currentConceptIndex, totalConcepts, perform]);

  // Safety timeout: if presenting phase stalls (onReady never fires), auto-advance
  useEffect(() => {
    if (phase === "presenting") {
      const timer = setTimeout(() => {
        console.warn("[Stage] Presenting safety timeout — auto-advancing");
        finishPresentation();
      }, PRESENTING_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }
  }, [phase, finishPresentation]);

  // Determine what to display based on browsing state
  const isBrowsing = browsingIndex !== null;
  const browsingEntry = isBrowsing ? history[browsingIndex] : null;

  // Show reasoning during reasoning and reasoning-done phases (or browsing history)
  const showReasoning =
    (!isBrowsing && (
      phase === "reasoning" ||
      phase === "reasoning-done" ||
      (phase === "presenting" && reasoning)
    )) ||
    (isBrowsing && browsingEntry?.reasoning);

  const reasoningText = isBrowsing ? (browsingEntry?.reasoning || "") : reasoning;

  // Determine which presentation to show
  const displayPresentation = isBrowsing
    ? browsingEntry
      ? { toolName: browsingEntry.toolName, props: browsingEntry.props }
      : null
    : currentPresentation;

  const showPresentation = isBrowsing
    ? !!browsingEntry
    : (phase === "presenting" || phase === "awaiting") && !!currentPresentation;

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      {/* Reasoning trace — for browsing, show as dimmed header above presentation */}
      {isBrowsing && browsingEntry?.reasoning && (
        <div className="absolute top-8 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="max-w-2xl px-6">
            <div className="font-mono text-xs leading-relaxed text-ink-faint tracking-wide opacity-50">
              {browsingEntry.reasoning}
            </div>
          </div>
        </div>
      )}

      {/* Reasoning phase — stays visible through reasoning-done, fades during presenting */}
      {!isBrowsing && showReasoning && (
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
            phase === "presenting" ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <ReasoningTrace
            text={reasoningText}
            isActive={phase === "reasoning" || phase === "reasoning-done"}
          />
        </div>
      )}

      {/* Presentation — current or historical */}
      {showPresentation && displayPresentation && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isBrowsing || phase === "presenting" || phase === "awaiting"
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          <ToolRenderer
            key={isBrowsing ? `history-${browsingIndex}` : `current-${currentConceptIndex}`}
            name={displayPresentation.toolName}
            props={displayPresentation.props}
            onReady={isBrowsing ? undefined : finishPresentation}
          />
        </div>
      )}

      {/* Navigation controls — centered bottom, context-dependent */}
      <NavigationControls />

      {/* Error state */}
      {phase === "error" && !isBrowsing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <p className="text-ink-muted font-mono text-sm">{errorMessage}</p>
          <button
            onClick={() => { clearError(); }}
            className="px-4 py-2 text-xs font-mono text-ink-muted hover:text-ink border border-stone-300 rounded-lg transition-colors cursor-pointer"
          >
            try again
          </button>
        </div>
      )}

      {/* Complete */}
      {phase === "complete" && !isBrowsing && (
        <div className="flex items-center justify-center h-full">
          <p className="text-ink-muted font-mono text-sm">fin.</p>
        </div>
      )}
    </div>
  );
}
