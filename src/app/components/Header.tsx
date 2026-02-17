"use client";

import { useState } from "react";

interface HeaderProps {
  visible: boolean;
}

export default function Header({ visible }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header
        className={`fixed top-3 left-3 right-3 z-40 transition-opacity duration-700 sm:top-6 sm:left-6 sm:right-auto ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="sm:hidden rounded-lg border border-stone-200 bg-surface/95 px-3 py-2 backdrop-blur-sm">
          <div className="flex items-center justify-between gap-3">
            <a
              href="/?replay=1"
              className="text-[11px] font-mono text-ink-faint hover:text-ink transition-colors tracking-[0.08em] uppercase"
            >
              George Stander
            </a>
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-global-menu"
              className="text-[10px] font-mono uppercase tracking-[0.08em] text-ink-faint hover:text-ink transition-colors"
            >
              {menuOpen ? "close" : "menu"}
            </button>
          </div>
        </div>

        <a
          href="/?replay=1"
          className="hidden sm:inline text-xs font-mono text-ink-faint hover:text-ink transition-colors tracking-[0.08em] uppercase"
        >
          George Stander
        </a>
      </header>

      {visible && menuOpen && (
        <div
          id="mobile-global-menu"
          className="sm:hidden fixed top-[4.35rem] left-3 right-3 z-40 rounded-lg border border-stone-200 bg-surface/95 px-3 py-3 backdrop-blur-sm"
        >
          <div className="mb-3 inline-flex items-center gap-1 text-[10px] font-mono text-ink-faint">
            <span>built with</span>
            <span className="inline-flex items-center rounded-sm bg-black px-1.5 py-0.5 text-white">
              curiosity
            </span>
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-[11px] font-mono uppercase tracking-[0.08em] text-ink-faint">
            <a
              href="/about"
              onClick={() => setMenuOpen(false)}
              className="hover:text-ink transition-colors"
            >
              About
            </a>
            <a
              href="/musings"
              onClick={() => setMenuOpen(false)}
              className="hover:text-ink transition-colors"
            >
              Musings
            </a>
            <a
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="hover:text-ink transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>
      )}
    </>
  );
}
