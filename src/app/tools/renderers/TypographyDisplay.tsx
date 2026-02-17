"use client";

import { useEffect, useState } from "react";
import type { TypographyDisplayProps } from "../definitions/typography-display";

interface Props {
  props: unknown;
  onReady?: () => void;
  onInteractionLockChange?: (locked: boolean) => void;
}

const fontMap: Record<string, string> = {
  serif: "font-serif",
  mono: "font-mono tracking-tight",
  handwritten: "font-serif italic",
};

export default function TypographyDisplay({ props, onReady }: Props) {
  const { headline, subtext, annotation, style = "serif" } = props as TypographyDisplayProps;
  const [phase, setPhase] = useState(0); // 0=hidden, 1=bar, 2=headline, 3=subtext, 4=annotation

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 80),
      setTimeout(() => setPhase(2), 300),
      setTimeout(() => setPhase(3), 900),
      setTimeout(() => setPhase(4), 1400),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase >= 3 && onReady) {
      const t = setTimeout(onReady, 600);
      return () => clearTimeout(t);
    }
  }, [phase, onReady]);

  return (
    <div className="flex flex-col justify-center h-full px-8 sm:px-16 relative overflow-hidden">
      {/* Decorative accent bar — slides in from left */}
      <div
        className="absolute left-0 top-[20%] bottom-[20%] w-1 bg-ink transition-all duration-700 ease-out"
        style={{
          transform: phase >= 1 ? "scaleY(1)" : "scaleY(0)",
          transformOrigin: "top",
        }}
      />

      {/* Step marker — large faded number in background */}
      <div
        className="absolute right-8 top-1/2 -translate-y-1/2 select-none pointer-events-none transition-opacity duration-1000"
        style={{
          fontSize: "clamp(12rem, 30vw, 28rem)",
          fontFamily: "Georgia, serif",
          lineHeight: 1,
          color: "rgba(0,0,0,0.03)",
          opacity: phase >= 1 ? 1 : 0,
        }}
      >
        &ldquo;
      </div>

      <div className="relative z-10 max-w-5xl pl-6 sm:pl-10">
        {/* Headline */}
        <h1
          className={`leading-[0.95] tracking-tight text-ink transition-all duration-700 ease-out ${
            fontMap[style] || "font-serif"
          } ${phase >= 2 ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-6"}`}
          style={{ fontSize: "clamp(2.2rem, 7vw, 5.5rem)" }}
        >
          {headline}
        </h1>

        {/* Rule + Subtext */}
        {subtext && (
          <div
            className={`mt-6 transition-all duration-600 ease-out ${
              phase >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
          >
            <div className="w-16 h-[1px] bg-ink-faint mb-4" />
            <p className="text-lg md:text-xl text-ink-muted leading-relaxed max-w-2xl">
              {subtext}
            </p>
          </div>
        )}
      </div>

      {/* Annotation — positioned as a marginal note */}
      {annotation && (
        <div
          className={`absolute bottom-10 right-8 sm:right-12 max-w-[240px] text-right transition-all duration-600 ease-out ${
            phase >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          }`}
        >
          <div className="w-8 h-[1px] bg-ink-faint/40 ml-auto mb-2" />
          <p className="text-[11px] text-ink-faint font-mono leading-relaxed italic">
            {annotation}
          </p>
        </div>
      )}
    </div>
  );
}
