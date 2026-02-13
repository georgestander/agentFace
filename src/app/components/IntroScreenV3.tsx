"use client";

/**
 * IntroScreenV3 — intro screen for the v3 runtime.
 *
 * Same typewriter effect as the legacy IntroScreen, but receives
 * onStart as a prop instead of reading from PerformanceContext.
 */

import { useEffect, useState } from "react";

const INTRO_TEXT =
  "I'm George's agent. I have a set of UI primitives to communicate his thinking — and he gave me free reign. I'll reason about each idea, then present it however I see fit.";

const CHAR_DELAY_MS = 30;
const BUTTON_DELAY_MS = 400;

interface IntroScreenV3Props {
  onStart: () => void;
}

export default function IntroScreenV3({ onStart }: IntroScreenV3Props) {
  const [displayedChars, setDisplayedChars] = useState(0);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    if (displayedChars < INTRO_TEXT.length) {
      const timer = setTimeout(() => {
        setDisplayedChars((c) => c + 1);
      }, CHAR_DELAY_MS);
      return () => clearTimeout(timer);
    } else {
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
            onClick={onStart}
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
