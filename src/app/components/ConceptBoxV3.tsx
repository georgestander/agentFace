"use client";

/**
 * ConceptBoxV3 — concept list for the v3 runtime.
 *
 * Standalone (does not depend on PerformanceContext). Receives state
 * as props from HomeV3.
 */

import { CONCEPTS } from "../agent/concepts";
import type { SessionPhase } from "../runtime/useShowSession";
import { useState } from "react";

interface ConceptBoxV3Props {
  currentStep: number;
  phase: SessionPhase;
  browsingIndex: number | null;
  onBrowseTo: (index: number) => void;
}

export default function ConceptBoxV3({
  currentStep,
  phase,
  browsingIndex,
  onBrowseTo,
}: ConceptBoxV3Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const maxVisible =
    phase === "complete"
      ? CONCEPTS.length
      : Math.min(currentStep + 2, CONCEPTS.length);
  const visibleConcepts = CONCEPTS.slice(0, maxVisible);
  const mobileSummary =
    phase === "complete"
      ? `steps ${CONCEPTS.length}/${CONCEPTS.length}`
      : `step ${Math.min(currentStep + 1, CONCEPTS.length)}/${CONCEPTS.length}`;

  return (
    <>
      <div className="hidden sm:block fixed top-14 left-4 z-20 w-[42vw] max-w-52 min-w-28 sm:left-6 sm:w-52">
        <ul className="space-y-2">
          {CONCEPTS.map((concept, i) => {
            if (i >= maxVisible) return null;

            const isCurrent = i === currentStep && phase !== "complete";
            const isPast = i < currentStep || phase === "complete";
            const isNext = i === currentStep + 1 && phase !== "complete";
            const isBrowsed = i === browsingIndex;

            return (
              <li
                key={concept.id}
                className={`text-xs font-mono leading-relaxed transition-all duration-500 pl-3 border-l-2 ${
                  isBrowsed
                    ? "border-accent text-ink opacity-100"
                    : isCurrent
                      ? "border-accent text-ink opacity-100"
                      : isPast
                        ? "border-transparent text-ink-muted opacity-70 cursor-pointer hover:text-ink hover:opacity-100"
                        : isNext
                          ? "border-transparent text-ink-faint opacity-30"
                          : "border-transparent text-ink-faint opacity-40"
                }`}
                onClick={isPast ? () => onBrowseTo(i) : undefined}
              >
                {concept.bullet}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="sm:hidden fixed top-[4.35rem] left-3 z-30">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className="rounded-md border border-stone-200 bg-surface/95 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-[0.08em] text-ink-faint backdrop-blur-sm"
          aria-expanded={mobileOpen}
          aria-controls="mobile-steps-panel"
        >
          {mobileSummary} {mobileOpen ? "−" : "+"}
        </button>

        {mobileOpen && (
          <div
            id="mobile-steps-panel"
            className="mt-2 w-[43vw] min-w-[9.75rem] max-w-[11.25rem] max-h-56 overflow-y-auto rounded-lg border border-stone-200 bg-surface/95 px-3 py-3 backdrop-blur-sm"
          >
            <ul className="space-y-2">
              {visibleConcepts.map((concept, i) => {
                const isCurrent = i === currentStep && phase !== "complete";
                const isPast = i < currentStep || phase === "complete";
                const isNext = i === currentStep + 1 && phase !== "complete";
                const isBrowsed = i === browsingIndex;

                return (
                  <li
                    key={concept.id}
                    className={`text-[11px] font-mono leading-relaxed transition-all duration-300 pl-2.5 border-l-2 ${
                      isBrowsed
                        ? "border-accent text-ink opacity-100"
                        : isCurrent
                          ? "border-accent text-ink opacity-100"
                          : isPast
                            ? "border-transparent text-ink-muted opacity-85 cursor-pointer"
                            : isNext
                              ? "border-transparent text-ink-faint opacity-45"
                              : "border-transparent text-ink-faint opacity-40"
                    }`}
                    onClick={isPast ? () => onBrowseTo(i) : undefined}
                  >
                    {concept.bullet}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
