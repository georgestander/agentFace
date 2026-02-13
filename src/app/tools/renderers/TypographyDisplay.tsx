"use client";

import { useEffect, useState } from "react";
import type { TypographyDisplayProps } from "../definitions/typography-display";

interface Props {
  props: unknown;
  onReady?: () => void;
}

const fontMap: Record<string, string> = {
  serif: "font-serif",
  mono: "font-mono",
  handwritten: "font-serif italic",
};

export default function TypographyDisplay({ props, onReady }: Props) {
  const { headline, subtext, annotation, style = "serif" } = props as TypographyDisplayProps;
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setRevealed(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (revealed && onReady) {
      const timer = setTimeout(onReady, 800);
      return () => clearTimeout(timer);
    }
  }, [revealed, onReady]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 relative">
      {/* Headline */}
      <h1
        className={`text-center leading-tight tracking-tight text-ink max-w-4xl transition-all duration-700 ease-out ${
          fontMap[style] || "font-serif"
        } ${
          revealed
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
        style={{ fontSize: "clamp(2rem, 7vw, 6rem)" }}
      >
        {headline}
      </h1>

      {/* Subtext */}
      {subtext && (
        <p
          className={`mt-8 text-center text-ink-muted text-lg md:text-xl max-w-2xl transition-all duration-700 delay-300 ease-out ${
            revealed
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
        >
          {subtext}
        </p>
      )}

      {/* Annotation */}
      {annotation && (
        <p
          className={`absolute bottom-8 right-8 text-sm text-ink-faint font-mono italic max-w-xs text-right transition-all duration-700 delay-500 ease-out ${
            revealed
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          }`}
        >
          {annotation}
        </p>
      )}
    </div>
  );
}
