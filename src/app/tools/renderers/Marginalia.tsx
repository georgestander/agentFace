"use client";

import { useEffect, useState, useMemo } from "react";
import type { MarginaliaProps } from "../definitions/marginalia";

interface Props {
  props: unknown;
  onReady?: () => void;
}

const toneMarker: Record<string, string> = {
  curious: "?",
  emphatic: "!",
  aside: "*",
};

const toneStyles: Record<string, string> = {
  curious: "text-ink-muted italic",
  emphatic: "text-ink font-medium",
  aside: "text-ink-faint",
};

export default function Marginalia({ props, onReady }: Props) {
  const { mainText, annotations } = props as MarginaliaProps;
  const [revealed, setRevealed] = useState(false);
  const [activeAnnotation, setActiveAnnotation] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (revealed && onReady) {
      const timer = setTimeout(onReady, 1000 + annotations.length * 200);
      return () => clearTimeout(timer);
    }
  }, [revealed, onReady, annotations.length]);

  const renderedText = useMemo(() => {
    const parts: Array<{ type: "text" | "anchor"; content: string; index: number }> = [];
    const anchors = annotations.map((a, i) => ({
      ...a,
      idx: i,
      start: mainText.indexOf(a.anchor),
    }));
    anchors.sort((a, b) => a.start - b.start);

    let lastEnd = 0;
    for (const anchor of anchors) {
      if (anchor.start === -1) continue;
      if (anchor.start > lastEnd) {
        parts.push({ type: "text", content: mainText.slice(lastEnd, anchor.start), index: -1 });
      }
      parts.push({ type: "anchor", content: anchor.anchor, index: anchor.idx });
      lastEnd = anchor.start + anchor.anchor.length;
    }
    if (lastEnd < mainText.length) {
      parts.push({ type: "text", content: mainText.slice(lastEnd), index: -1 });
    }
    return parts;
  }, [mainText, annotations]);

  return (
    <div
      className="flex items-start justify-center h-full overflow-y-auto"
      style={{ background: "linear-gradient(180deg, #f5f3ef 0%, #f8f7f4 100%)" }}
    >
      {/* Page border */}
      <div
        className="w-full max-w-4xl mx-6 sm:mx-12 my-10 border border-stone-200/60 rounded-sm px-8 sm:px-12 py-10"
        style={{ boxShadow: "0 1px 12px rgba(0,0,0,0.03)" }}
      >
        <div className="flex gap-8 sm:gap-14">
          {/* Main text column */}
          <div
            className={`flex-1 font-serif text-lg leading-[1.8] text-ink transition-opacity duration-700 ${
              revealed ? "opacity-100" : "opacity-0"
            }`}
          >
            {renderedText.map((part, i) => {
              if (part.type === "text") {
                return <span key={i}>{part.content}</span>;
              }
              const ann = annotations[part.index];
              const marker = toneMarker[ann?.tone || "aside"];
              return (
                <span
                  key={i}
                  className={`relative cursor-default transition-colors duration-200 ${
                    activeAnnotation === part.index
                      ? "bg-yellow-100/60"
                      : "hover:bg-yellow-50/40"
                  }`}
                  style={{ textDecorationStyle: "wavy", textDecorationColor: "#c4b5a0" }}
                  onMouseEnter={() => setActiveAnnotation(part.index)}
                  onMouseLeave={() => setActiveAnnotation(null)}
                >
                  {part.content}
                  <sup className="text-[9px] font-mono text-ink-faint ml-0.5 select-none">
                    {marker}
                  </sup>
                </span>
              );
            })}
          </div>

          {/* Annotations column — manuscript-style margin notes */}
          <div className="w-44 sm:w-52 shrink-0 space-y-5 border-l border-stone-200/50 pl-5">
            {annotations.map((ann, i) => (
              <div
                key={i}
                className={`transition-all duration-500 ${toneStyles[ann.tone || "aside"]} ${
                  revealed ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3"
                } ${activeAnnotation === i ? "opacity-100" : "opacity-60"}`}
                style={{ transitionDelay: `${500 + i * 150}ms` }}
                onMouseEnter={() => setActiveAnnotation(i)}
                onMouseLeave={() => setActiveAnnotation(null)}
              >
                <span className="font-mono text-[9px] text-ink-faint/50 mr-1.5 select-none">
                  {toneMarker[ann.tone || "aside"]}
                </span>
                <span className="text-xs leading-relaxed font-serif">
                  {ann.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
