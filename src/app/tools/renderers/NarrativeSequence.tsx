"use client";

import { useEffect, useState, useCallback } from "react";
import type { NarrativeSequenceProps } from "../definitions/narrative-sequence";

interface Props {
  props: unknown;
  onReady?: () => void;
  onInteractionLockChange?: (locked: boolean) => void;
}

export default function NarrativeSequence({ props, onReady }: Props) {
  const { beats, conclusion } = props as NarrativeSequenceProps;
  const [currentBeat, setCurrentBeat] = useState(-1); // -1 = not started
  const [showConclusion, setShowConclusion] = useState(false);
  const [progress, setProgress] = useState(0);

  // Start the first beat after mount
  useEffect(() => {
    const t = setTimeout(() => setCurrentBeat(0), 400);
    return () => clearTimeout(t);
  }, []);

  // Auto-advance beats with visible progress
  useEffect(() => {
    if (currentBeat < 0 || currentBeat >= beats.length || showConclusion) return;

    const duration = beats[currentBeat].pause || 3000;
    const interval = 30;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      setProgress(Math.min(elapsed / duration, 1));
      if (elapsed >= duration) {
        clearInterval(timer);
        if (currentBeat >= beats.length - 1) {
          setShowConclusion(true);
        } else {
          setCurrentBeat((b) => b + 1);
          setProgress(0);
        }
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentBeat, beats, showConclusion]);

  useEffect(() => {
    if (showConclusion) onReady?.();
  }, [showConclusion, onReady]);

  const skipToBeat = useCallback(
    (direction: 1 | -1) => {
      if (showConclusion && direction === -1) {
        setShowConclusion(false);
        setCurrentBeat(beats.length - 1);
        setProgress(0);
        return;
      }
      const next = currentBeat + direction;
      if (next >= beats.length) {
        setShowConclusion(true);
      } else if (next >= 0) {
        setCurrentBeat(next);
        setProgress(0);
      }
    },
    [currentBeat, beats.length, showConclusion]
  );

  const beat = currentBeat >= 0 && currentBeat < beats.length ? beats[currentBeat] : null;

  const emphasisStyles: Record<string, string> = {
    normal: "text-2xl md:text-3xl text-stone-100 font-light",
    strong: "text-3xl md:text-4xl text-white font-medium",
    whisper: "text-xl md:text-2xl text-stone-400 italic font-light",
  };

  return (
    <div
      className="flex flex-col items-center justify-center h-full relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, #1a1a1a 0%, #111 50%, #0a0a0a 100%)" }}
    >
      {/* Cinematic letterbox bars */}
      <div className="absolute top-0 left-0 right-0 h-[12%] bg-black/40" />
      <div className="absolute bottom-0 left-0 right-0 h-[12%] bg-black/40" />

      {/* Beat counter */}
      <div className="absolute top-[14%] right-8 font-mono text-[11px] text-stone-600 tracking-widest">
        {showConclusion
          ? "fin"
          : currentBeat >= 0
            ? `${String(currentBeat + 1).padStart(2, "0")} / ${String(beats.length).padStart(2, "0")}`
            : ""}
      </div>

      {/* Progress bar */}
      {!showConclusion && currentBeat >= 0 && (
        <div className="absolute bottom-[12%] left-[10%] right-[10%] h-[1px] bg-stone-800">
          <div
            className="h-full bg-stone-500 transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* Beat text */}
      {beat && !showConclusion && (
        <div
          key={currentBeat}
          className="px-12 max-w-3xl text-center"
          style={{ animation: "fade-in-up 0.5s ease-out forwards" }}
        >
          <p className={`leading-relaxed ${emphasisStyles[beat.emphasis || "normal"]}`}>
            {beat.text}
          </p>
        </div>
      )}

      {/* Conclusion */}
      {showConclusion && conclusion && (
        <div
          className="px-12 max-w-2xl text-center"
          style={{ animation: "fade-in-up 0.7s ease-out forwards" }}
        >
          <div className="w-12 h-[1px] bg-stone-600 mx-auto mb-6" />
          <p className="text-xl md:text-2xl text-stone-300 font-serif leading-relaxed">
            {conclusion}
          </p>
        </div>
      )}

      {/* Tap zones for manual navigation */}
      <button
        className="absolute left-0 top-[12%] bottom-[12%] w-1/4 cursor-w-resize opacity-0"
        onClick={() => skipToBeat(-1)}
        aria-label="Previous beat"
      />
      <button
        className="absolute right-0 top-[12%] bottom-[12%] w-1/4 cursor-e-resize opacity-0"
        onClick={() => skipToBeat(1)}
        aria-label="Next beat"
      />

      {/* Inline keyframe for this component */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
