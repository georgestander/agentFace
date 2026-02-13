"use client";

import { useEffect, useState, useRef } from "react";
import type { NarrativeSequenceProps } from "../definitions/narrative-sequence";

interface Props {
  props: unknown;
  onReady?: () => void;
}

const emphasisStyles: Record<string, string> = {
  normal: "text-2xl md:text-3xl text-ink",
  strong: "text-3xl md:text-4xl text-ink font-semibold",
  whisper: "text-xl md:text-2xl text-ink-muted italic",
};

export default function NarrativeSequence({ props, onReady }: Props) {
  const { beats, conclusion } = props as NarrativeSequenceProps;
  const [currentBeat, setCurrentBeat] = useState(0);
  const [showConclusion, setShowConclusion] = useState(false);
  const [beatVisible, setBeatVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (currentBeat >= beats.length) {
      if (conclusion) {
        setShowConclusion(true);
      }
      onReady?.();
      return;
    }

    const pause = beats[currentBeat].pause ?? 2500;

    // Show beat
    setBeatVisible(true);

    timerRef.current = setTimeout(() => {
      // Fade out before next
      setBeatVisible(false);
      setTimeout(() => {
        setCurrentBeat((b) => b + 1);
      }, 400);
    }, pause);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentBeat, beats, conclusion, onReady]);

  const beat = beats[currentBeat];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 relative">
      {/* Current beat */}
      {beat && !showConclusion && (
        <p
          className={`text-center max-w-3xl leading-relaxed transition-all duration-400 ease-out ${
            emphasisStyles[beat.emphasis || "normal"]
          } ${beatVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
        >
          {beat.text}
        </p>
      )}

      {/* Beat indicator */}
      {!showConclusion && (
        <div className="absolute bottom-12 flex gap-2">
          {beats.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                i === currentBeat
                  ? "bg-ink"
                  : i < currentBeat
                    ? "bg-ink-faint"
                    : "bg-stone-300"
              }`}
            />
          ))}
        </div>
      )}

      {/* Conclusion */}
      {showConclusion && conclusion && (
        <p
          className="text-center text-xl md:text-2xl text-ink max-w-2xl leading-relaxed font-serif animate-fade-in"
          style={{ animation: "fadeIn 0.6s ease-out" }}
        >
          {conclusion}
        </p>
      )}
    </div>
  );
}
