"use client";

import { CONCEPTS } from "../agent/concepts";
import { usePerformance } from "../context/PerformanceContext";

export default function ConceptBox() {
  const { currentConceptIndex, phase } = usePerformance();

  return (
    <div className="fixed top-6 right-6 w-56 z-20">
      <ul className="space-y-2">
        {CONCEPTS.map((concept, i) => {
          const isCurrent = i === currentConceptIndex && phase !== "complete";
          const isPast = i < currentConceptIndex || phase === "complete";

          return (
            <li
              key={concept.id}
              className={`text-xs font-mono leading-relaxed transition-all duration-500 pl-3 border-l-2 ${
                isCurrent
                  ? "border-accent text-ink opacity-100"
                  : isPast
                    ? "border-transparent text-ink-faint line-through opacity-50"
                    : "border-transparent text-ink-faint opacity-40"
              }`}
            >
              {concept.bullet}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
