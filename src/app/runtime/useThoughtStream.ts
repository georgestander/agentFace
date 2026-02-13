"use client";

/**
 * useThoughtStream — manages streaming thought text for the current step.
 *
 * Provides both the live-streaming text and a short-clamped version
 * for the collapsed ThoughtRail display.
 */

import { useCallback, useState, useRef } from "react";

const SHORT_CHAR_LIMIT = 120;

interface ThoughtStream {
  /** Full reasoning text accumulated so far */
  full: string;
  /** Short-clamped version (one sentence, max SHORT_CHAR_LIMIT chars) */
  short: string;
  /** Whether the stream is currently active */
  isStreaming: boolean;
  /** Append a delta chunk to the thought */
  append: (delta: string) => void;
  /** Set the complete thought at once (e.g. from cached packet) */
  set: (full: string, short?: string) => void;
  /** Start a new thought stream */
  start: () => void;
  /** Mark stream as complete */
  finish: () => void;
  /** Clear all thought state */
  clear: () => void;
}

function clampShort(text: string): string {
  // Take first sentence or up to char limit
  const sentenceEnd = text.search(/[.!?]\s/);
  if (sentenceEnd >= 0 && sentenceEnd < SHORT_CHAR_LIMIT) {
    return text.slice(0, sentenceEnd + 1);
  }
  if (text.length <= SHORT_CHAR_LIMIT) return text;
  return text.slice(0, SHORT_CHAR_LIMIT).trimEnd() + "\u2026";
}

export function useThoughtStream(): ThoughtStream {
  const [full, setFull] = useState("");
  const [short, setShort] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const fullRef = useRef("");

  const append = useCallback((delta: string) => {
    fullRef.current += delta;
    const updated = fullRef.current;
    setFull(updated);
    setShort(clampShort(updated));
  }, []);

  const set = useCallback((fullText: string, shortText?: string) => {
    fullRef.current = fullText;
    setFull(fullText);
    setShort(shortText || clampShort(fullText));
    setIsStreaming(false);
  }, []);

  const start = useCallback(() => {
    fullRef.current = "";
    setFull("");
    setShort("");
    setIsStreaming(true);
  }, []);

  const finish = useCallback(() => {
    setIsStreaming(false);
  }, []);

  const clear = useCallback(() => {
    fullRef.current = "";
    setFull("");
    setShort("");
    setIsStreaming(false);
  }, []);

  return { full, short, isStreaming, append, set, start, finish, clear };
}
