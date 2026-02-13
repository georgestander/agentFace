"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CONCEPTS } from "../agent/concepts";

const DEBUG_PERFORMANCE = import.meta.env.DEV;

function debugLog(...args: unknown[]) {
  if (DEBUG_PERFORMANCE) console.log(...args);
}

export type PerformancePhase =
  | "intro"
  | "idle"
  | "reasoning"
  | "reasoning-done"
  | "presenting"
  | "awaiting"
  | "complete"
  | "error";

export interface Presentation {
  toolName: string;
  props: Record<string, unknown>;
}

export interface HistoryEntry {
  conceptIndex: number;
  toolName: string;
  props: Record<string, unknown>;
  toolCallId: string;
  reasoning: string;
}

interface PerformanceState {
  phase: PerformancePhase;
  currentConceptIndex: number;
  reasoning: string;
  currentPresentation: Presentation | null;
  currentToolCallId: string;
  history: HistoryEntry[];
  errorMessage: string;
  /** null = viewing current concept, number = viewing a history entry */
  browsingIndex: number | null;
}

interface PerformanceContextValue extends PerformanceState {
  startReasoning: () => void;
  updateReasoning: (text: string) => void;
  present: (toolName: string, props: Record<string, unknown>, toolCallId: string) => void;
  showPresentation: () => void;
  finishPresentation: () => void;
  advance: () => void;
  setError: (message: string) => void;
  clearError: () => void;
  startPerformance: () => void;
  goBack: () => void;
  goForward: () => void;
  browseTo: (index: number) => void;
  totalConcepts: number;
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

export function usePerformance(): PerformanceContextValue {
  const ctx = useContext(PerformanceContext);
  if (!ctx) throw new Error("usePerformance must be used within PerformanceProvider");
  return ctx;
}

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PerformanceState>({
    phase: "intro",
    currentConceptIndex: 0,
    reasoning: "",
    currentPresentation: null,
    currentToolCallId: "",
    history: [],
    errorMessage: "",
    browsingIndex: null,
  });

  const startReasoning = useCallback(() => {
    setState((s) => ({ ...s, phase: "reasoning", reasoning: "", browsingIndex: null }));
  }, []);

  const updateReasoning = useCallback((text: string) => {
    setState((s) => ({ ...s, reasoning: text }));
  }, []);

  const present = useCallback(
    (toolName: string, props: Record<string, unknown>, toolCallId: string) => {
      setState((s) => ({
        ...s,
        phase: "reasoning-done",
        currentPresentation: { toolName, props },
        currentToolCallId: toolCallId,
      }));
    },
    []
  );

  const showPresentation = useCallback(() => {
    setState((s) => ({
      ...s,
      phase: "presenting",
    }));
  }, []);

  const finishPresentation = useCallback(() => {
    setState((s) => ({
      ...s,
      phase: "awaiting",
    }));
  }, []);

  const setError = useCallback((message: string) => {
    setState((s) => ({ ...s, phase: "error", errorMessage: message }));
  }, []);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, phase: "idle", errorMessage: "" }));
  }, []);

  const startPerformance = useCallback(() => {
    setState((s) => ({ ...s, phase: "idle" }));
  }, []);

  const goBack = useCallback(() => {
    setState((s) => {
      if (s.history.length === 0) return s;

      if (s.browsingIndex === null) {
        // Currently viewing current concept — go to last history entry
        return { ...s, browsingIndex: s.history.length - 1 };
      } else if (s.browsingIndex > 0) {
        // Move back in history
        return { ...s, browsingIndex: s.browsingIndex - 1 };
      }
      return s;
    });
  }, []);

  const goForward = useCallback(() => {
    setState((s) => {
      if (s.browsingIndex === null) return s;

      if (s.browsingIndex < s.history.length - 1) {
        // Move forward in history
        return { ...s, browsingIndex: s.browsingIndex + 1 };
      } else {
        // At the end of history — return to current concept
        return { ...s, browsingIndex: null };
      }
    });
  }, []);

  const browseTo = useCallback((index: number) => {
    setState((s) => {
      if (index < 0 || index >= s.history.length) return s;
      return { ...s, browsingIndex: index };
    });
  }, []);

  const advance = useCallback(() => {
    setState((s) => {
      // If browsing history, return to current first
      if (s.browsingIndex !== null) {
        debugLog("[Context] advance: returning from browsing");
        return { ...s, browsingIndex: null };
      }

      const entry: HistoryEntry = {
        conceptIndex: s.currentConceptIndex,
        toolName: s.currentPresentation?.toolName || "",
        props: s.currentPresentation?.props || {},
        toolCallId: s.currentToolCallId,
        reasoning: s.reasoning,
      };

      const nextIndex = s.currentConceptIndex + 1;
      const isComplete = nextIndex >= CONCEPTS.length;

      debugLog(
        "[Context] advance:",
        s.currentConceptIndex,
        "→",
        nextIndex,
        "complete:",
        isComplete,
        "tool:",
        s.currentPresentation?.toolName,
        "toolCallId:",
        s.currentToolCallId
      );

      return {
        ...s,
        phase: isComplete ? "complete" : "idle",
        currentConceptIndex: isComplete ? s.currentConceptIndex : nextIndex,
        reasoning: "",
        currentPresentation: null,
        currentToolCallId: "",
        history: [...s.history, entry],
        browsingIndex: null,
      };
    });
  }, []);

  return (
    <PerformanceContext.Provider
      value={{
        ...state,
        startReasoning,
        updateReasoning,
        present,
        showPresentation,
        finishPresentation,
        advance,
        setError,
        clearError,
        startPerformance,
        goBack,
        goForward,
        browseTo,
        totalConcepts: CONCEPTS.length,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}
