"use client";

import { useEffect, useState } from "react";
import type { ComparisonProps } from "../definitions/comparison";

interface Props {
  props: unknown;
  onReady?: () => void;
  onInteractionLockChange?: (locked: boolean) => void;
}

export default function Comparison({ props, onReady }: Props) {
  const { left, right, verdict } = props as ComparisonProps;
  const [phase, setPhase] = useState(0); // 0=hidden, 1=headers, 2=points, 3=verdict

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 150),
      setTimeout(() => setPhase(2), 500),
      setTimeout(() => setPhase(3), 1200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase >= 2 && onReady) {
      const t = setTimeout(onReady, 800);
      return () => clearTimeout(t);
    }
  }, [phase, onReady]);

  const isConventional = left.tone === "conventional";
  const isPreferred = right.tone === "preferred";

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Split background */}
      <div className="absolute inset-0 flex">
        <div className="w-1/2" style={{ background: isConventional ? "#f0efee" : "#f4f3f2" }} />
        <div className="w-1/2" style={{ background: isPreferred ? "#f8f8f7" : "#f4f3f2" }} />
      </div>

      {/* Center divider */}
      <div
        className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-stone-300 transition-all duration-700 ease-out"
        style={{
          transform: phase >= 1 ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: "top",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-1 items-center px-6 sm:px-12">
        <div className="grid grid-cols-2 gap-8 sm:gap-16 max-w-4xl w-full mx-auto">
          {/* Left column */}
          <div className="pr-4">
            <h3
              className={`text-sm font-mono uppercase tracking-[0.12em] mb-6 transition-all duration-500 ${
                isConventional ? "text-ink-faint" : "text-ink-muted"
              } ${phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}
            >
              {left.heading}
            </h3>
            <ul className="space-y-4">
              {left.points.map((point, i) => (
                <li
                  key={i}
                  className={`text-sm leading-relaxed pl-4 transition-all duration-500 ${
                    isConventional
                      ? "text-ink-muted border-l border-stone-300"
                      : "text-ink border-l border-stone-400"
                  } ${phase >= 2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                  style={{ transitionDelay: `${500 + i * 80}ms` }}
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Right column */}
          <div className="pl-4">
            <h3
              className={`text-sm font-mono uppercase tracking-[0.12em] mb-6 transition-all duration-500 ${
                isPreferred ? "text-ink" : "text-ink-muted"
              } ${phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-3"}`}
              style={{ transitionDelay: "100ms" }}
            >
              {right.heading}
            </h3>
            <ul className="space-y-4">
              {right.points.map((point, i) => (
                <li
                  key={i}
                  className={`text-sm leading-relaxed pl-4 transition-all duration-500 ${
                    isPreferred
                      ? "text-ink border-l-2 border-ink"
                      : "text-ink border-l border-stone-400"
                  } ${phase >= 2 ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"}`}
                  style={{ transitionDelay: `${600 + i * 80}ms` }}
                >
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Verdict */}
      {verdict && (
        <div
          className={`relative z-10 px-6 sm:px-12 pb-16 pt-4 transition-all duration-600 ${
            phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          <div className="max-w-lg mx-auto text-center">
            <div className="inline-block px-5 py-2.5 border border-stone-300 rounded-sm">
              <p className="text-sm text-ink-muted font-mono leading-relaxed">{verdict}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
