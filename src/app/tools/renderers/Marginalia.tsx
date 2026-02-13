"use client";

import { useEffect, useState, useMemo } from "react";
import type { MarginaliaProps } from "../definitions/marginalia";

interface Props {
  props: unknown;
  onReady?: () => void;
}

const toneStyles: Record<string, string> = {
  curious: "text-accent italic",
  emphatic: "text-ink font-medium",
  aside: "text-ink-muted",
};

export default function Marginalia({ props, onReady }: Props) {
  const { mainText, annotations } = props as MarginaliaProps;
  const [revealed, setRevealed] = useState(false);
  const [activeAnnotation, setActiveAnnotation] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (revealed && onReady) {
      const timer = setTimeout(onReady, 1000 + annotations.length * 300);
      return () => clearTimeout(timer);
    }
  }, [revealed, onReady, annotations.length]);

  // Build the main text with marked anchors
  const renderedText = useMemo(() => {
    let result = mainText;
    const parts: Array<{ type: "text" | "anchor"; content: string; index: number }> = [];

    // Find all anchor positions
    const anchors = annotations.map((a, i) => ({
      ...a,
      idx: i,
      start: mainText.indexOf(a.anchor),
    }));

    // Sort by position
    anchors.sort((a, b) => a.start - b.start);

    let lastEnd = 0;
    for (const anchor of anchors) {
      if (anchor.start === -1) continue;

      // Text before anchor
      if (anchor.start > lastEnd) {
        parts.push({ type: "text", content: mainText.slice(lastEnd, anchor.start), index: -1 });
      }

      // The anchor itself
      parts.push({ type: "anchor", content: anchor.anchor, index: anchor.idx });
      lastEnd = anchor.start + anchor.anchor.length;
    }

    // Remaining text
    if (lastEnd < mainText.length) {
      parts.push({ type: "text", content: mainText.slice(lastEnd), index: -1 });
    }

    return parts;
  }, [mainText, annotations]);

  return (
    <div className="flex items-start justify-center h-full px-8 py-16 overflow-y-auto">
      <div className="flex gap-12 max-w-4xl w-full">
        {/* Main text column */}
        <div
          className={`flex-1 text-lg leading-relaxed text-ink transition-opacity duration-700 ${
            revealed ? "opacity-100" : "opacity-0"
          }`}
        >
          {renderedText.map((part, i) => {
            if (part.type === "text") {
              return <span key={i}>{part.content}</span>;
            }
            return (
              <span
                key={i}
                className={`border-b-2 cursor-default transition-colors duration-200 ${
                  activeAnnotation === part.index
                    ? "border-accent bg-accent-faint"
                    : "border-stone-300 hover:border-accent"
                }`}
                onMouseEnter={() => setActiveAnnotation(part.index)}
                onMouseLeave={() => setActiveAnnotation(null)}
              >
                {part.content}
              </span>
            );
          })}
        </div>

        {/* Annotations column */}
        <div className="w-48 shrink-0 space-y-4">
          {annotations.map((ann, i) => (
            <div
              key={i}
              className={`text-xs leading-relaxed pl-3 border-l-2 transition-all duration-500 ${
                toneStyles[ann.tone || "aside"]
              } ${
                activeAnnotation === i
                  ? "border-accent opacity-100"
                  : "border-transparent opacity-60"
              } ${revealed ? "translate-x-0" : "translate-x-4"}`}
              style={{ transitionDelay: `${400 + i * 200}ms` }}
              onMouseEnter={() => setActiveAnnotation(i)}
              onMouseLeave={() => setActiveAnnotation(null)}
            >
              {ann.note}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
