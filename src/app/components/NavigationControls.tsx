"use client";

import { usePerformance } from "../context/PerformanceContext";

export default function NavigationControls() {
  const {
    phase,
    currentConceptIndex,
    showPresentation,
    advance,
    totalConcepts,
  } = usePerformance();

  // Only show during reasoning-done and awaiting phases
  if (phase !== "reasoning-done" && phase !== "awaiting") return null;

  const isLastConcept = currentConceptIndex >= totalConcepts - 1;

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4">
      {phase === "reasoning-done" && (
        <button
          onClick={showPresentation}
          className="px-5 py-2.5 text-sm font-mono text-ink-muted hover:text-ink border border-stone-300 hover:border-stone-400 rounded-lg transition-colors duration-200 cursor-pointer bg-surface/80 backdrop-blur-sm"
        >
          show me &rarr;
        </button>
      )}

      {phase === "awaiting" && (
        <button
          onClick={advance}
          className="px-5 py-2.5 text-sm font-mono text-ink-muted hover:text-ink border border-stone-300 hover:border-stone-400 rounded-lg transition-colors duration-200 cursor-pointer bg-surface/80 backdrop-blur-sm"
        >
          {isLastConcept ? "fin" : "next \u2192"}
        </button>
      )}
    </div>
  );
}
