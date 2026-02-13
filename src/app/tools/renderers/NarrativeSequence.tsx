"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (currentBeat >= beats.length && !showConclusion) {
      setShowConclusion(true);
    }
  }, [currentBeat, beats.length, showConclusion]);

  useEffect(() => {
    if (showConclusion && onReady) {
      onReady();
    }
  }, [showConclusion, onReady]);

  const isLastBeat = currentBeat >= beats.length - 1;
  const beat = beats[currentBeat];

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 relative">
      {beat && !showConclusion ? (
        <>
          <p
            className={`text-center max-w-3xl leading-relaxed transition-all duration-400 ease-out ${
              emphasisStyles[beat.emphasis || "normal"]
            }`}
          >
            {beat.text}
          </p>

          <button
            onClick={() => setCurrentBeat((b) => Math.min(b + 1, beats.length))}
            className="mt-8 text-sm font-mono text-ink-faint hover:text-ink transition-colors duration-200"
          >
            {isLastBeat ? "show conclusion" : "next beat"}
          </button>

          <div className="absolute bottom-12 flex gap-2" aria-label="Beat progress">
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
        </>
      ) : null}

      {showConclusion && conclusion && (
        <p className="text-center text-xl md:text-2xl text-ink max-w-2xl leading-relaxed font-serif transition-opacity duration-700 opacity-100">
          {conclusion}
        </p>
      )}
    </div>
  );
}
