"use client";

/**
 * NavigationControlsV3 — navigation controls for the v3 runtime.
 *
 * Standalone (does not depend on PerformanceContext). Receives all
 * state and callbacks as props from StageV3.
 */

import type { SessionPhase } from "../runtime/useShowSession";

interface NavigationControlsV3Props {
  phase: SessionPhase;
  currentStep: number;
  totalConcepts: number;
  browsingIndex: number | null;
  onShowPresentation: () => void;
  onAdvance: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
}

export default function NavigationControlsV3({
  phase,
  currentStep,
  totalConcepts,
  browsingIndex,
  onShowPresentation,
  onAdvance,
  onGoBack,
  onGoForward,
}: NavigationControlsV3Props) {
  const isBrowsing = browsingIndex !== null;
  const isLastConcept = currentStep >= totalConcepts - 1;
  const canGoBack = isBrowsing ? browsingIndex > 0 : currentStep > 0;

  const showControls =
    phase === "reasoning-done" ||
    phase === "awaiting" ||
    isBrowsing;

  if (!showControls) return null;

  const buttonClass =
    "px-5 py-2.5 text-sm font-mono text-ink-muted hover:text-ink border border-stone-300 hover:border-stone-400 rounded-lg transition-colors duration-200 cursor-pointer bg-surface/80 backdrop-blur-sm";

  const secondaryClass =
    "px-4 py-2 text-xs font-mono text-ink-faint hover:text-ink-muted transition-colors duration-200 cursor-pointer";

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
      {/* Back button */}
      {canGoBack && (phase === "awaiting" || isBrowsing) && (
        <button onClick={onGoBack} className={secondaryClass}>
          &larr; back
        </button>
      )}

      {/* Browsing: forward / continue */}
      {isBrowsing && (
        <button onClick={onGoForward} className={buttonClass}>
          continue &rarr;
        </button>
      )}

      {/* Show me button (reasoning-done, not browsing) */}
      {!isBrowsing && phase === "reasoning-done" && (
        <button onClick={onShowPresentation} className={buttonClass}>
          show me &rarr;
        </button>
      )}

      {/* Next / fin button (awaiting, not browsing) */}
      {!isBrowsing && phase === "awaiting" && (
        <button onClick={onAdvance} className={buttonClass}>
          {isLastConcept ? "fin" : "next \u2192"}
        </button>
      )}
    </div>
  );
}
