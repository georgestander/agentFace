"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CONCEPTS } from "../agent/concepts";

export type PerformancePhase =
  | "idle"
  | "reasoning"
  | "presenting"
  | "awaiting"
  | "complete"
  | "error";

export interface Presentation {
  toolName: string;
  props: Record<string, unknown>;
}

interface HistoryEntry {
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
}

interface PerformanceContextValue extends PerformanceState {
  startReasoning: () => void;
  updateReasoning: (text: string) => void;
  present: (toolName: string, props: Record<string, unknown>, toolCallId: string) => void;
  finishPresentation: () => void;
  advance: () => void;
  setError: (message: string) => void;
  clearError: () => void;
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
    phase: "idle",
    currentConceptIndex: 0,
    reasoning: "",
    currentPresentation: null,
    currentToolCallId: "",
    history: [],
    errorMessage: "",
  });

  const startReasoning = useCallback(() => {
    setState((s) => ({ ...s, phase: "reasoning", reasoning: "" }));
  }, []);

  const updateReasoning = useCallback((text: string) => {
    setState((s) => ({ ...s, reasoning: text }));
  }, []);

  const present = useCallback(
    (toolName: string, props: Record<string, unknown>, toolCallId: string) => {
      setState((s) => ({
        ...s,
        phase: "presenting",
        currentPresentation: { toolName, props },
        currentToolCallId: toolCallId,
      }));
    },
    []
  );

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

  const advance = useCallback(() => {
    setState((s) => {
      const entry: HistoryEntry = {
        conceptIndex: s.currentConceptIndex,
        toolName: s.currentPresentation?.toolName || "",
        props: s.currentPresentation?.props || {},
        toolCallId: s.currentToolCallId,
        reasoning: s.reasoning,
      };

      const nextIndex = s.currentConceptIndex + 1;
      const isComplete = nextIndex >= CONCEPTS.length;

      return {
        ...s,
        phase: isComplete ? "complete" : "idle",
        currentConceptIndex: isComplete ? s.currentConceptIndex : nextIndex,
        reasoning: "",
        currentPresentation: null,
        currentToolCallId: "",
        history: [...s.history, entry],
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
        finishPresentation,
        advance,
        setError,
        clearError,
        totalConcepts: CONCEPTS.length,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}
