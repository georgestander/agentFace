"use client";

/**
 * IntroScreenV3 — intro screen for the v3 runtime.
 *
 * Same typewriter effect as the legacy IntroScreen, but receives
 * onStart as a prop instead of reading from PerformanceContext.
 */

import { useEffect, useState } from "react";
import { useIntroCopy } from "./useIntroCopy";

const CHAR_DELAY_MS = 30;
const BUTTON_DELAY_MS = 400;

interface IntroScreenV3Props {
  onStart: () => void;
}

export default function IntroScreenV3({ onStart }: IntroScreenV3Props) {
  const { text: introText, warning } = useIntroCopy();
  const [displayedChars, setDisplayedChars] = useState(0);
  const [showButtons, setShowButtons] = useState(false);

  // Restart typewriter whenever intro copy changes.
  useEffect(() => {
    setDisplayedChars(0);
    setShowButtons(false);
  }, [introText]);

  useEffect(() => {
    if (displayedChars < introText.length) {
      const timer = setTimeout(() => {
        setDisplayedChars((c) => c + 1);
      }, CHAR_DELAY_MS);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShowButtons(true), BUTTON_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [displayedChars, introText]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="max-w-lg">
        <p className="font-mono text-sm leading-relaxed text-ink-muted tracking-wide break-words">
          {introText.slice(0, displayedChars)}
          {displayedChars < introText.length && (
            <span className="inline-block w-[2px] h-[1em] bg-ink-muted align-text-bottom ml-0.5 animate-pulse" />
          )}
        </p>

        <p
          className={`mt-4 text-[11px] font-mono uppercase tracking-[0.08em] text-red-700 border border-red-300/70 bg-red-50/40 px-2 py-1 rounded-sm break-words transition-opacity duration-500 ${
            showButtons ? "opacity-90" : "opacity-0"
          }`}
        >
          {warning}
        </p>

        <div
          className={`mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 transition-all duration-500 ${
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
