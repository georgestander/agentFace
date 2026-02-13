"use client";

import { useEffect, useState } from "react";
import type { ComparisonProps } from "../definitions/comparison";

interface Props {
  props: unknown;
  onReady?: () => void;
}

export default function Comparison({ props, onReady }: Props) {
  const { left, right, verdict } = props as ComparisonProps;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (revealed && onReady) {
      const timer = setTimeout(onReady, 1200);
      return () => clearTimeout(timer);
    }
  }, [revealed, onReady]);

  const isConventional = left.tone === "conventional";
  const isPreferred = right.tone === "preferred";

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="grid grid-cols-2 gap-8 max-w-3xl w-full">
        {/* Left column */}
        <div
          className={`space-y-4 transition-all duration-600 ease-out ${
            revealed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
          }`}
        >
          <h3
            className={`text-lg font-medium pb-3 border-b ${
              isConventional
                ? "text-ink-muted border-stone-200"
                : "text-ink border-stone-300"
            }`}
          >
            {left.heading}
          </h3>
          <ul className="space-y-3">
            {left.points.map((point, i) => (
              <li
                key={i}
                className={`text-sm leading-relaxed pl-4 border-l-2 transition-all duration-500 ${
                  isConventional
                    ? "text-ink-muted border-stone-200"
                    : "text-ink border-stone-300"
                } ${revealed ? "opacity-100" : "opacity-0"}`}
                style={{ transitionDelay: `${300 + i * 100}ms` }}
              >
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Right column */}
        <div
          className={`space-y-4 transition-all duration-600 ease-out ${
            revealed ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
          }`}
          style={{ transitionDelay: "150ms" }}
        >
          <h3
            className={`text-lg font-medium pb-3 border-b ${
              isPreferred
                ? "text-ink border-accent"
                : "text-ink border-stone-300"
            }`}
          >
            {right.heading}
          </h3>
          <ul className="space-y-3">
            {right.points.map((point, i) => (
              <li
                key={i}
                className={`text-sm leading-relaxed pl-4 border-l-2 transition-all duration-500 ${
                  isPreferred
                    ? "text-ink border-accent-light"
                    : "text-ink border-stone-300"
                } ${revealed ? "opacity-100" : "opacity-0"}`}
                style={{ transitionDelay: `${450 + i * 100}ms` }}
              >
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Verdict */}
      {verdict && (
        <p
          className={`mt-10 text-center text-sm text-ink-muted font-mono max-w-lg transition-all duration-600 ${
            revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          {verdict}
        </p>
      )}
    </div>
  );
}
