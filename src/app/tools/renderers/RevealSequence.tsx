"use client";

import { useState, useEffect } from "react";
import type { RevealSequenceProps } from "../definitions/reveal-sequence";

interface Props {
  props: unknown;
  onReady?: () => void;
}

const kindStyles: Record<string, string> = {
  text: "text-lg md:text-xl text-ink leading-relaxed",
  label: "text-xs font-mono text-ink-muted uppercase tracking-widest",
  highlight: "text-lg md:text-xl text-ink font-medium bg-accent-faint px-2 py-1 rounded inline",
};

export default function RevealSequence({ props, onReady }: Props) {
  const { layers, title } = props as RevealSequenceProps;
  const [revealedCount, setRevealedCount] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (revealedCount >= layers.length) {
      onReady?.();
    }
  }, [revealedCount, layers.length, onReady]);

  const revealNext = () => {
    if (revealedCount < layers.length) {
      setRevealedCount((c) => c + 1);
    }
  };

  const allRevealed = revealedCount >= layers.length;

  return (
    <div className="flex flex-col items-center justify-center h-full px-8">
      <div className="max-w-xl w-full space-y-6">
        {/* Title */}
        {title && (
          <h2
            className={`text-sm font-mono text-ink-faint uppercase tracking-widest mb-8 transition-all duration-500 ${
              mounted ? "opacity-100" : "opacity-0"
            }`}
          >
            {title}
          </h2>
        )}

        {/* Layers */}
        {layers.map((layer, i) => {
          const isRevealed = i < revealedCount;
          return (
            <div
              key={i}
              className={`transition-all duration-500 ease-out ${
                isRevealed
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4 h-0 overflow-hidden"
              }`}
              style={{ transitionDelay: isRevealed ? "100ms" : "0ms" }}
            >
              <p className={kindStyles[layer.kind || "text"]}>{layer.content}</p>
            </div>
          );
        })}

        {/* Reveal prompt */}
        {!allRevealed && (
          <button
            onClick={revealNext}
            className="mt-4 text-sm font-mono text-ink-faint hover:text-ink transition-colors duration-200 cursor-pointer"
          >
            reveal more ({revealedCount}/{layers.length})
          </button>
        )}
      </div>
    </div>
  );
}
