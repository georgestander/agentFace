"use client";

import { useEffect, useState } from "react";

const FIN_TEXT = "That's how George thinks. If any of this resonated, here's where to go next.";
const CHAR_DELAY_MS = 25;
const BUTTON_DELAY_MS = 500;

export default function FinScreen() {
  const [displayedChars, setDisplayedChars] = useState(0);
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    if (displayedChars < FIN_TEXT.length) {
      const timer = setTimeout(() => setDisplayedChars((c) => c + 1), CHAR_DELAY_MS);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShowButtons(true), BUTTON_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [displayedChars]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6">
      <div className="max-w-lg text-center">
        <p className="font-mono text-sm leading-relaxed text-ink-muted tracking-wide">
          {FIN_TEXT.slice(0, displayedChars)}
          {displayedChars < FIN_TEXT.length && (
            <span className="inline-block w-[2px] h-[1em] bg-ink-muted align-text-bottom ml-0.5 animate-pulse" />
          )}
        </p>

        <div
          className={`mt-12 flex items-center justify-center gap-6 transition-all duration-500 ${
            showButtons ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <a
            href="/about"
            className="px-5 py-2.5 text-sm font-mono text-ink-muted hover:text-ink border border-stone-300 hover:border-stone-400 rounded-lg transition-colors duration-200"
          >
            about
          </a>
          <a
            href="/projects"
            className="px-5 py-2.5 text-sm font-mono text-ink-muted hover:text-ink border border-stone-300 hover:border-stone-400 rounded-lg transition-colors duration-200"
          >
            projects
          </a>
          <a
            href="/contact"
            className="px-5 py-2.5 text-sm font-mono text-ink-muted hover:text-ink border border-stone-300 hover:border-stone-400 rounded-lg transition-colors duration-200"
          >
            contact
          </a>
        </div>
      </div>
    </div>
  );
}
