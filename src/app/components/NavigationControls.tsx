"use client";

import { usePerformance } from "../context/PerformanceContext";

export default function NavigationControls() {
  const {
    phase,
    currentConceptIndex,
    browsingIndex,
    history,
    showPresentation,
    advance,
    goBack,
    goForward,
    totalConcepts,
  } = usePerformance();

  const isBrowsing = browsingIndex !== null;
  const isLastConcept = currentConceptIndex >= totalConcepts - 1;
  const canGoBack = isBrowsing ? browsingIndex > 0 : history.length > 0;

  // Show during: reasoning-done, awaiting, or while browsing history
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
        <button onClick={goBack} className={secondaryClass}>
          &larr; back
        </button>
      )}

      {/* Browsing: forward / continue */}
      {isBrowsing && (
        <>
          <button onClick={goForward} className={buttonClass}>
            {browsingIndex < history.length - 1 ? "next \u2192" : "continue \u2192"}
          </button>
        </>
      )}

      {/* Show me button (reasoning-done, not browsing) */}
      {!isBrowsing && phase === "reasoning-done" && (
        <button onClick={showPresentation} className={buttonClass}>
          show me &rarr;
        </button>
      )}

      {/* Next / fin button (awaiting, not browsing) */}
      {!isBrowsing && phase === "awaiting" && (
        <button onClick={advance} className={buttonClass}>
          {isLastConcept ? "fin" : "next \u2192"}
        </button>
      )}
    </div>
  );
}
