"use client";

import { useEffect, useState } from "react";

interface ReasoningTraceProps {
  text: string;
  isActive: boolean;
  collapsed?: boolean;
}

export default function ReasoningTrace({
  text,
  isActive,
  collapsed = false,
}: ReasoningTraceProps) {
  const shouldRender = text || collapsed || isActive;
  if (!shouldRender) return null;

  const [isExpanded, setIsExpanded] = useState(!collapsed);

  useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isActive]);

  const headerLabel = isActive ? "Agent thinking..." : "Agent";

  return (
    <div
      className={`w-full max-w-md border-l-2 border-accent-light bg-accent-faint/50 shadow-sm transition-all duration-300 ${
        isExpanded ? "opacity-100" : "translate-y-1 opacity-80"
      }`}
      role="region"
      aria-live="polite"
      aria-label="Agent reasoning"
    >
      <button
        type="button"
        className="w-full px-3 py-2 flex items-center justify-between gap-3 text-left"
        onClick={() => {
          setIsExpanded((prev) => !prev);
        }}
        aria-label={isExpanded ? "Collapse reasoning trace" : "Expand reasoning trace"}
      >
        <div className="flex items-center gap-2">
          <p className="font-serif text-[11px] font-medium tracking-wide text-accent">
            {headerLabel}
          </p>
          <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-ink-faint">
            {isActive ? "streaming" : "trace"}
          </p>
        </div>
        <span className="text-[10px] font-mono text-ink-faint transition-transform duration-200">
          {isExpanded ? "▾" : "▸"}
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="font-serif text-[11px] leading-relaxed text-ink-faint">
            {text || (isActive ? "..." : "")}
          </div>
        </div>
      )}
    </div>
  );
}
