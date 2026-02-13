"use client";

import { useCallback, useEffect, useRef } from "react";
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
const FETCH_TIMEOUT_MS = 60_000;
const DEBUG_STREAM = import.meta.env.DEV;

function debugLog(...args: unknown[]) {
  if (DEBUG_STREAM) console.log(...args);
}

function debugWarn(...args: unknown[]) {
  if (DEBUG_STREAM) console.warn(...args);
}

function ThinkingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5 text-ink-faint" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => {
        const delay = `${index * 120}ms`;
        return (
          <span
            key={index}
            className="block w-1 h-1 rounded-full bg-ink-faint"
            style={{
              animation: "thinking-dot 1s infinite",
              animationDelay: delay,
            }}
          />
        );
      })}
    </div>
  );
}

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

  // Use refs for values that perform() needs so the callback doesn't go stale across state transitions
  const historyRef = useRef(history);
  const conceptIndexRef = useRef(currentConceptIndex);
  historyRef.current = history;
  conceptIndexRef.current = currentConceptIndex;

  /**
   * Trigger the agent to perform the current concept.
   * Reads from refs to always get the latest state values.
   */
  const perform = useCallback(async () => {
    if (isPerforming.current) {
      debugWarn("[Stage] perform() skipped — already performing");
      return;
    }

    isPerforming.current = true;
    debugLog(
      "[Stage] perform() starting for concept",
      conceptIndexRef.current,
      "history length:",
      historyRef.current.length
    );
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

      // Always include a user turn so providers that reject empty chat content
      // can process the request consistently.
      messages.push({
        role: "user",
        content:
          currentHistory.length > 0
            ? "The visitor has seen your presentation and is ready for the next concept. Continue."
            : "The visitor is ready. Present the first concept now.",
      });

      const usedTools = currentHistory.map((entry) => entry.toolName);
      const requestBody = {
        messages,
        conceptIndex: currentIndex,
        usedTools,
      };
      debugLog("[Stage] Sending request:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/perform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} ${errorText}`);
      }

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let state: StreamState = createStreamState();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          state = processSSELine(line, state);
          if (state.streamError) {
            throw new Error(`OPENROUTER_STREAM_ERROR: ${state.streamError}`);
          }
          // Update reasoning text in real-time
          if (state.reasoning) {
            updateReasoning(state.reasoning);
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        state = processSSELine(buffer, state);
        if (state.streamError) {
          throw new Error(`OPENROUTER_STREAM_ERROR: ${state.streamError}`);
        }
      }

      // Stream done — validate tool call and transition to reasoning-done
      // (the visitor clicks "show me" to proceed to presenting)
      debugLog(
        "[Stage] Stream done. Tool calls:",
        state.toolCalls.length,
        "Reasoning length:",
        state.reasoning.length
      );
      if (state.toolCalls.length > 0) {
        debugLog(
          "[Stage] Tool call:",
          state.toolCalls[0].name,
          "id:",
          state.toolCalls[0].id,
          "args length:",
          state.toolCalls[0].argumentsJson.length
        );
        const result = validateToolCall(state.toolCalls[0]);
        if (result.valid) {
          debugLog("[Stage] Tool validated successfully:", result.name);
          present(result.name, result.props, state.toolCalls[0].id);
        } else {
          console.error("[Stage] Tool validation failed:", result.error);
          setError("The agent's response wasn't quite right. Let's try again.");
        }
      } else {
        // No tool call received — the agent didn't call a tool
        console.error("[Stage] No tool call in response. Reasoning:", state.reasoning.slice(0, 200));
        setError("The model responded without a presentation tool. Please try again.");
      }
    } catch (err) {
      console.error("[Stage] Performance error:", err);
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("The agent took too long to respond. Let's try again.");
      } else if (err instanceof Error && err.message.startsWith("OPENROUTER_STREAM_ERROR: ")) {
        setError(err.message.replace("OPENROUTER_STREAM_ERROR: ", ""));
      } else if (err instanceof Error && err.message.startsWith("API error: ")) {
        setError("The AI service returned an error. Check model/tool compatibility and retry.");
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
    debugLog("[Stage] useEffect: phase=", phase, "conceptIndex=", currentConceptIndex, "total=", totalConcepts);
    if (phase === "idle" && currentConceptIndex < totalConcepts) {
      debugLog("[Stage] Auto-triggering perform()", { phase, currentConceptIndex });
      perform();
    }
  }, [phase, currentConceptIndex, totalConcepts, perform]);

  // Safety timeout: if presenting phase stalls (onReady never fires), auto-advance
  useEffect(() => {
    if (phase === "presenting") {
      const timer = setTimeout(() => {
        debugWarn("[Stage] Presenting safety timeout — auto-advancing");
        finishPresentation();
      }, PRESENTING_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }
  }, [phase, finishPresentation]);

  // Determine what to display based on browsing state
  const isBrowsing = browsingIndex !== null;
  const browsingEntry = isBrowsing ? history[browsingIndex] : null;

  // Show reasoning while thinking, while the visitor inspects it, and in browsing mode
  const showReasoning =
    isBrowsing || phase === "reasoning" || phase === "reasoning-done";

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
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {showPresentation && displayPresentation && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isBrowsing || phase === "presenting" || phase === "awaiting" ? "opacity-100" : "opacity-0"
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

      {/* Reasoning trace sits bottom center and can collapse in history */}
      {showReasoning && (
        <div className="absolute left-1/2 bottom-24 z-20 w-full -translate-x-1/2 px-6 text-center">
          <div
            className={`mx-auto w-fit transition-all duration-500 ${
              isBrowsing
                ? "opacity-90"
                : phase === "presenting"
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
            }`}
          >
            <ReasoningTrace
              text={reasoningText}
              isActive={phase === "reasoning"}
              collapsed={isBrowsing}
            />
          </div>
          {phase === "reasoning" && <ThinkingDots />}
        </div>
      )}

      {/* Navigation controls — centered bottom, context-dependent */}
      <NavigationControls />

      {/* Error state */}
      {phase === "error" && !isBrowsing && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-surface/60 backdrop-blur-sm">
          <p className="text-ink-muted font-mono text-sm">{errorMessage}</p>
          <button
            onClick={() => {
              clearError();
            }}
            className="px-4 py-2 text-xs font-mono text-ink-muted hover:text-ink border border-stone-300 rounded-lg transition-colors cursor-pointer"
          >
            try again
          </button>
        </div>
      )}
    </div>
  );
}
