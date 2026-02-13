"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { usePerformance } from "../context/PerformanceContext";
import { CONCEPTS } from "../agent/concepts";
import {
  createStreamState,
  processSSELine,
  validateToolCall,
  type StreamState,
} from "../agent/parse-stream";
import ReasoningTrace from "./ReasoningTrace";
import ToolRenderer from "./ToolRenderer";

export default function Stage() {
  const {
    phase,
    currentConceptIndex,
    reasoning,
    currentPresentation,
    history,
    startReasoning,
    updateReasoning,
    present,
    finishPresentation,
    advance,
    totalConcepts,
  } = usePerformance();

  const isPerforming = useRef(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    startReasoning();

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

      // Stream done — validate and render the tool call
      if (state.toolCalls.length > 0) {
        const result = validateToolCall(state.toolCalls[0]);
        if (result.valid) {
          present(result.name, result.props, state.toolCalls[0].id);
        } else {
          console.error("[Stage] Tool validation failed:", result.error);
        }
      }
    } catch (err) {
      console.error("[Stage] Performance error:", err);
      setError("Something went wrong. The agent stumbled.");
    } finally {
      isPerforming.current = false;
    }
  }, [startReasoning, updateReasoning, present]);

  // Auto-trigger performance when phase becomes idle (and we have concepts left)
  useEffect(() => {
    if (phase === "idle" && currentConceptIndex < totalConcepts) {
      perform();
    }
  }, [phase, currentConceptIndex, totalConcepts, perform]);

  const concept = CONCEPTS[currentConceptIndex];

  return (
    <div className="flex flex-col items-center justify-center h-full w-full relative">
      {/* Reasoning phase */}
      {(phase === "reasoning" || (phase === "presenting" && reasoning)) && (
        <div
          className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${
            phase === "presenting" ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <ReasoningTrace text={reasoning} isActive={phase === "reasoning"} />
        </div>
      )}

      {/* Presentation phase */}
      {(phase === "presenting" || phase === "awaiting") && currentPresentation && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            phase === "presenting" || phase === "awaiting" ? "opacity-100" : "opacity-0"
          }`}
        >
          <ToolRenderer
            name={currentPresentation.toolName}
            props={currentPresentation.props}
            onReady={finishPresentation}
          />
        </div>
      )}

      {/* Awaiting — next control */}
      {phase === "awaiting" && (
        <div className="absolute bottom-8 right-8 z-10">
          <button
            onClick={advance}
            className="px-5 py-2.5 text-sm font-mono text-ink-muted hover:text-ink border border-stone-300 hover:border-stone-400 rounded-lg transition-colors duration-200 cursor-pointer bg-surface/80 backdrop-blur-sm"
          >
            {currentConceptIndex < totalConcepts - 1 ? "next →" : "fin"}
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <p className="text-ink-muted font-mono text-sm">{error}</p>
          <button
            onClick={() => { setError(null); perform(); }}
            className="px-4 py-2 text-xs font-mono text-ink-muted hover:text-ink border border-stone-300 rounded-lg transition-colors cursor-pointer"
          >
            try again
          </button>
        </div>
      )}

      {/* Complete */}
      {phase === "complete" && (
        <div className="flex items-center justify-center h-full">
          <p className="text-ink-muted font-mono text-sm">fin.</p>
        </div>
      )}
    </div>
  );
}
