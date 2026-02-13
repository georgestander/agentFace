"use client";

import { CONCEPTS } from "../agent/concepts";
import { usePerformance } from "../context/PerformanceContext";

export default function ConceptBox() {
  const { currentConceptIndex, phase, browsingIndex, history, browseTo } = usePerformance();

  // Progressive reveal: show up to current + 1 (peek at next)
  const maxVisible = phase === "complete"
    ? CONCEPTS.length
    : Math.min(currentConceptIndex + 2, CONCEPTS.length);

  // Which concept is being browsed (history entries map 1:1 to concepts)
  const browsedConceptIndex = browsingIndex !== null
    ? history[browsingIndex]?.conceptIndex ?? -1
    : -1;

  return (
    <div className="fixed top-6 right-6 w-56 z-20">
      <ul className="space-y-2">
        {CONCEPTS.map((concept, i) => {
          // Only show concepts up to maxVisible
          if (i >= maxVisible) return null;

          const isCurrent = i === currentConceptIndex && phase !== "complete";
          const isPast = i < currentConceptIndex || phase === "complete";
          const isNext = i === currentConceptIndex + 1 && phase !== "complete";
          const isBrowsed = i === browsedConceptIndex;

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
              onClick={isPast ? () => browseTo(i) : undefined}
            >
              {concept.bullet}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
