"use client";

import { useState, useEffect } from "react";
import type { RevealSequenceProps } from "../definitions/reveal-sequence";

interface Props {
  props: unknown;
  onReady?: () => void;
}

const kindStyles: Record<string, { card: string; text: string }> = {
  text: {
    card: "border-l-2 border-stone-300",
    text: "text-base md:text-lg text-ink leading-relaxed",
  },
  label: {
    card: "border-l-2 border-ink-faint",
    text: "text-xs font-mono text-ink-muted uppercase tracking-[0.15em]",
  },
  highlight: {
    card: "border-l-2 border-ink",
    text: "text-base md:text-lg text-ink font-medium leading-relaxed",
  },
};

export default function RevealSequence({ props, onReady }: Props) {
  const { layers, title } = props as RevealSequenceProps;
  const [revealedCount, setRevealedCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true);
      setRevealedCount(1);
    }, 200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (revealedCount >= layers.length) onReady?.();
  }, [revealedCount, layers.length, onReady]);

  const revealNext = () => {
    if (revealedCount < layers.length) {
      setRevealedCount((c) => c + 1);
    }
  };

  const allRevealed = revealedCount >= layers.length;

  return (
    <div className="flex items-center justify-center h-full px-6 sm:px-12 overflow-y-auto">
      <div className="max-w-xl w-full py-16">
        {/* Title */}
        {title && (
          <div
            className={`mb-10 transition-all duration-500 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
          >
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink-faint">
              layers
            </span>
            <h2 className="text-sm font-mono text-ink-muted mt-1">
              {title}
            </h2>
          </div>
        )}

        {/* Layer cards */}
        <div className="space-y-4">
          {layers.map((layer, i) => {
            const isRevealed = i < revealedCount;
            const styles = kindStyles[layer.kind || "text"];

            return (
              <div
                key={i}
                className={`transition-all duration-500 ease-out ${
                  isRevealed
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6 pointer-events-none h-0 overflow-hidden"
                }`}
                style={{ transitionDelay: isRevealed ? `${Math.min(i * 80, 300)}ms` : "0ms" }}
              >
                <div
                  className={`pl-5 py-3 rounded-r-sm bg-surface-raised/60 ${styles.card}`}
                  style={{
                    boxShadow: isRevealed ? "0 1px 4px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[10px] text-ink-faint/50 mt-1 select-none shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <p className={styles.text}>{layer.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reveal button */}
        {!allRevealed && revealedCount > 0 && (
          <button
            onClick={revealNext}
            className="mt-6 flex items-center gap-3 group cursor-pointer"
          >
            <span className="w-8 h-[1px] bg-stone-300 group-hover:bg-ink-faint transition-colors" />
            <span className="text-sm font-mono text-ink-faint group-hover:text-ink-muted transition-colors">
              peel back layer {revealedCount + 1}
            </span>
          </button>
        )}

        {/* All revealed indicator */}
        {allRevealed && (
          <div className="mt-8 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-stone-300" />
            <span className="font-mono text-[10px] text-ink-faint/60 tracking-widest uppercase">
              all layers revealed
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
