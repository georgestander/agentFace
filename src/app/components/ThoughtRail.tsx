"use client";

/**
 * ThoughtRail — v3 thought trace display.
 *
 * - Docked right rail on desktop, top collapsible drawer on mobile.
 * - Always mounted as part of layout.
 * - Collapses to compact chip in non-reasoning phases.
 * - Expands during reasoning / reasoning-done.
 * - Deterministic style variation per step (ticker, pulse-line,
 *   terminal-ledger, dossier-note).
 * - Scrollable internal body with short-clamp default + expand toggle.
 */

import { useState, useEffect, useRef } from "react";
import type { ThoughtStyle } from "../runtime/seed";

const SHORT_CHAR_LIMIT = 120;

interface ThoughtRailProps {
  /** Full reasoning text */
  text: string;
  /** Short-clamped text for collapsed display */
  shortText?: string;
  /** Whether the stream is currently active */
  isStreaming: boolean;
  /** Whether the rail should be expanded (reasoning phases) */
  expanded: boolean;
  /** Deterministic style variant for this step */
  style: ThoughtStyle;
  /** Per-step token count (shown when available) */
  stepTokens?: number;
}

function clampShort(text: string): string {
  const sentenceEnd = text.search(/[.!?]\s/);
  if (sentenceEnd >= 0 && sentenceEnd < SHORT_CHAR_LIMIT) {
    return text.slice(0, sentenceEnd + 1);
  }
  if (text.length <= SHORT_CHAR_LIMIT) return text;
  return text.slice(0, SHORT_CHAR_LIMIT).trimEnd() + "\u2026";
}

// ---------------------------------------------------------------------------
// Style variant renderers
// ---------------------------------------------------------------------------

function TickerContent({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <div className="font-mono text-[10px] leading-tight tracking-[0.05em] text-ink-faint uppercase overflow-hidden">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-accent text-[9px]">FEED</span>
        {isStreaming && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        )}
      </div>
      <div className="whitespace-pre-wrap break-words">{text}</div>
    </div>
  );
}

function PulseLineContent({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <div className="relative">
      {isStreaming && (
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent/40 overflow-hidden">
          <div
            className="w-full bg-accent"
            style={{
              height: "30%",
              animation: "thinking-dot 1.5s ease-in-out infinite",
            }}
          />
        </div>
      )}
      <div className={`font-serif text-[11px] leading-relaxed text-ink-faint ${isStreaming ? "pl-2.5" : ""}`}>
        {text}
      </div>
    </div>
  );
}

function TerminalLedgerContent({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <div className="font-mono text-[10px] leading-snug text-ink-faint">
      <div className="flex items-center gap-1.5 mb-1 text-[9px] text-ink-faint/60">
        <span>$</span>
        <span>agent.reason()</span>
        {isStreaming && <span className="animate-pulse">_</span>}
      </div>
      <div className="pl-2 border-l border-ink-faint/20 whitespace-pre-wrap break-words">
        {text}
      </div>
    </div>
  );
}

function DossierNoteContent({ text, isStreaming }: { text: string; isStreaming: boolean }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="h-[1px] flex-1 bg-ink-faint/20" />
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-ink-faint/50">
          note
        </span>
        <div className="h-[1px] flex-1 bg-ink-faint/20" />
      </div>
      <div className="font-serif text-[11px] leading-relaxed text-ink-faint italic">
        {text}
        {isStreaming && <span className="not-italic animate-pulse ml-0.5">|</span>}
      </div>
    </div>
  );
}

const STYLE_RENDERERS: Record<
  ThoughtStyle,
  React.FC<{ text: string; isStreaming: boolean }>
> = {
  "ticker": TickerContent,
  "pulse-line": PulseLineContent,
  "terminal-ledger": TerminalLedgerContent,
  "dossier-note": DossierNoteContent,
};

// ---------------------------------------------------------------------------
// ThoughtRail
// ---------------------------------------------------------------------------

export default function ThoughtRail({
  text,
  shortText,
  isStreaming,
  expanded,
  style,
  stepTokens,
}: ThoughtRailProps) {
  const [showFull, setShowFull] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when streaming
  useEffect(() => {
    if (isStreaming && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text, isStreaming]);

  // Reset expand state when step changes
  useEffect(() => {
    setShowFull(false);
  }, [style]);

  const displayText = showFull ? text : (shortText || clampShort(text));
  const hasMore = text.length > (shortText || clampShort(text)).length;
  const StyleRenderer = STYLE_RENDERERS[style] || PulseLineContent;

  // Compact chip (non-reasoning phases)
  if (!expanded && !isStreaming) {
    if (!text) return null;
    return (
      <div className="fixed top-4 right-4 z-30 sm:top-4 sm:right-4">
        <div className="bg-surface/90 backdrop-blur-sm border border-stone-200 rounded px-2.5 py-1.5 max-w-48 cursor-default">
          <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-ink-faint/60 mb-0.5">
            trace
          </p>
          <p className="font-serif text-[10px] leading-tight text-ink-faint truncate">
            {shortText || clampShort(text)}
          </p>
        </div>
      </div>
    );
  }

  // Expanded rail
  return (
    <>
      {/* Desktop: right rail */}
      <div className="hidden sm:block fixed top-14 right-4 z-30 w-56 max-h-[calc(100vh-8rem)]">
        <div className="bg-surface/95 backdrop-blur-sm border border-stone-200 rounded shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-3 py-2 flex items-center justify-between border-b border-stone-100">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent">
                {isStreaming ? "thinking" : "thought"}
              </span>
              {isStreaming && (
                <span className="inline-block w-1 h-1 rounded-full bg-accent animate-pulse" />
              )}
            </div>
            {stepTokens != null && stepTokens > 0 && (
              <span className="font-mono text-[9px] text-ink-faint/50">
                {stepTokens.toLocaleString()}t
              </span>
            )}
          </div>

          {/* Body */}
          <div
            ref={scrollRef}
            className="px-3 py-2.5 max-h-48 overflow-y-auto"
            role="region"
            aria-live="polite"
            aria-label="Agent reasoning"
          >
            <StyleRenderer text={displayText} isStreaming={isStreaming} />
          </div>

          {/* Expand toggle */}
          {hasMore && !isStreaming && (
            <button
              onClick={() => setShowFull((p) => !p)}
              className="w-full px-3 py-1.5 text-[9px] font-mono text-ink-faint/50 hover:text-ink-faint border-t border-stone-100 transition-colors"
            >
              {showFull ? "less" : "more"}
            </button>
          )}
        </div>
      </div>

      {/* Mobile: top drawer */}
      <div className="sm:hidden fixed top-12 left-3 right-3 z-30">
        <div className="bg-surface/95 backdrop-blur-sm border border-stone-200 rounded shadow-sm overflow-hidden">
          <div className="px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] tracking-[0.15em] uppercase text-accent">
                {isStreaming ? "thinking" : "thought"}
              </span>
              {isStreaming && (
                <span className="inline-block w-1 h-1 rounded-full bg-accent animate-pulse" />
              )}
            </div>
            {stepTokens != null && stepTokens > 0 && (
              <span className="font-mono text-[9px] text-ink-faint/50">
                {stepTokens.toLocaleString()}t
              </span>
            )}
          </div>
          <div className="px-3 pb-2.5 max-h-24 overflow-y-auto">
            <StyleRenderer text={displayText} isStreaming={isStreaming} />
          </div>
        </div>
      </div>
    </>
  );
}
