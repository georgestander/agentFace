"use client";

/**
 * ConceptBoxV3 — concept list for the v3 runtime.
 *
 * Standalone (does not depend on PerformanceContext). Receives state
 * as props from HomeV3.
 */

import { CONCEPTS } from "../agent/concepts";
import type { SessionPhase } from "../runtime/useShowSession";

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
  const maxVisible =
    phase === "complete"
      ? CONCEPTS.length
      : Math.min(currentStep + 2, CONCEPTS.length);

  return (
    <div className="fixed top-14 left-4 z-20 w-[42vw] max-w-52 min-w-28 sm:left-6 sm:w-52">
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
  );
}
