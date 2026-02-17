"use client";

import { useEffect, useState } from "react";
import { usePerformance } from "../context/PerformanceContext";

const INTRO_TEXT =
  "I'm George's agent. Show up every day and make things that have soul. Things with story, feeling, and a reason to exist. I'll reason about each idea, then present it in a way that fits.";

const CHAR_DELAY_MS = 30;
const BUTTON_DELAY_MS = 400;

export default function IntroScreen() {
  const { startPerformance } = usePerformance();
  const [displayedChars, setDisplayedChars] = useState(0);
  const [showButtons, setShowButtons] = useState(false);

  // Typewriter effect
  useEffect(() => {
    if (displayedChars < INTRO_TEXT.length) {
      const timer = setTimeout(() => {
        setDisplayedChars((c) => c + 1);
      }, CHAR_DELAY_MS);
      return () => clearTimeout(timer);
    } else {
      // Text complete — show buttons after brief pause
      const timer = setTimeout(() => setShowButtons(true), BUTTON_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [displayedChars]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="max-w-lg">
        <p className="font-mono text-sm leading-relaxed text-ink-muted tracking-wide">
          {INTRO_TEXT.slice(0, displayedChars)}
          {displayedChars < INTRO_TEXT.length && (
            <span className="inline-block w-[2px] h-[1em] bg-ink-muted align-text-bottom ml-0.5 animate-pulse" />
          )}
        </p>

        <div
          className={`mt-10 flex items-center gap-6 transition-all duration-500 ${
            showButtons ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <button
            onClick={startPerformance}
            className="px-5 py-2.5 text-sm font-mono text-ink hover:text-accent border border-stone-300 hover:border-accent rounded-lg transition-colors duration-200 cursor-pointer bg-surface/80"
          >
            yes, show me
          </button>
          <a
            href="/conventional"
            className="text-sm font-mono text-ink-faint hover:text-ink-muted transition-colors duration-200"
          >
            no, just show me the site
          </a>
        </div>
      </div>
    </div>
  );
}
