"use client";

/**
 * useTokenLedger — tracks per-step token usage and session totals.
 */

import { useCallback, useState } from "react";
import { type TokenUsage, emptyTokenUsage } from "./types";

interface TokenLedger {
  /** Per-step token usage, keyed by stepIndex */
  byStep: Record<number, TokenUsage>;
  /** Running session total */
  totals: TokenUsage;
  /** Record usage for a completed step */
  record: (stepIndex: number, usage: TokenUsage) => void;
  /** Hydrate from persisted totals (e.g. on session restore) */
  hydrate: (byStep: Record<number, TokenUsage>, totals: TokenUsage) => void;
  /** Average tokens per step */
  averagePerStep: number;
}

export function useTokenLedger(): TokenLedger {
  const [byStep, setByStep] = useState<Record<number, TokenUsage>>({});
  const [totals, setTotals] = useState<TokenUsage>(emptyTokenUsage());

  const record = useCallback((stepIndex: number, usage: TokenUsage) => {
    setByStep((prev) => ({ ...prev, [stepIndex]: usage }));
    setTotals((prev) => ({
      promptTokens: prev.promptTokens + usage.promptTokens,
      completionTokens: prev.completionTokens + usage.completionTokens,
      reasoningTokens: (prev.reasoningTokens ?? 0) + (usage.reasoningTokens ?? 0),
      totalTokens: prev.totalTokens + usage.totalTokens,
      provider: usage.provider || prev.provider,
    }));
  }, []);

  const hydrate = useCallback(
    (restoredByStep: Record<number, TokenUsage>, restoredTotals: TokenUsage) => {
      setByStep(restoredByStep);
      setTotals(restoredTotals);
    },
    []
  );

  const stepCount = Object.keys(byStep).length;
  const averagePerStep = stepCount > 0 ? Math.round(totals.totalTokens / stepCount) : 0;

  return { byStep, totals, record, hydrate, averagePerStep };
}
