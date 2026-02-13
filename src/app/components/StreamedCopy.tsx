"use client";

/**
 * StreamedCopy — staccato text reveal for static page content.
 *
 * No inference required. Deterministic client-side animation that
 * reveals content blocks with a light staccato effect.
 */

import { useState, useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CopyBlock {
  type: "p" | "li" | "quote" | "code";
  text: string;
}

interface StreamedCopyProps {
  heading?: string;
  blocks: CopyBlock[];
  /** Delay between block reveals in ms */
  blockDelay?: number;
  /** Character reveal speed in ms */
  charDelay?: number;
}

// ---------------------------------------------------------------------------
// Block renderer
// ---------------------------------------------------------------------------

function BlockContent({
  block,
  revealed,
  charIndex,
}: {
  block: CopyBlock;
  revealed: boolean;
  charIndex: number;
}) {
  const text = revealed ? block.text : block.text.slice(0, charIndex);
  const showCursor = !revealed && charIndex < block.text.length;

  const cursor = showCursor ? (
    <span className="inline-block w-[1px] h-[1em] bg-ink-muted align-text-bottom ml-0.5 animate-pulse" />
  ) : null;

  switch (block.type) {
    case "p":
      return (
        <p className="text-sm text-ink-muted leading-relaxed">
          {text}
          {cursor}
        </p>
      );
    case "li":
      return (
        <li className="text-sm text-ink-muted leading-relaxed pl-4 border-l-2 border-stone-200">
          {text}
          {cursor}
        </li>
      );
    case "quote":
      return (
        <blockquote className="text-sm text-ink-faint leading-relaxed italic pl-4 border-l-2 border-accent-light">
          {text}
          {cursor}
        </blockquote>
      );
    case "code":
      return (
        <pre className="font-mono text-xs text-ink-muted bg-surface-raised px-3 py-2 rounded overflow-x-auto">
          {text}
          {cursor}
        </pre>
      );
  }
}

// ---------------------------------------------------------------------------
// StreamedCopy
// ---------------------------------------------------------------------------

export default function StreamedCopy({
  heading,
  blocks,
  blockDelay = 200,
  charDelay = 12,
}: StreamedCopyProps) {
  const [currentBlock, setCurrentBlock] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [revealedBlocks, setRevealedBlocks] = useState<Set<number>>(new Set());
  const pauseRef = useRef(false);

  useEffect(() => {
    if (currentBlock >= blocks.length) return;

    const block = blocks[currentBlock];
    if (charIndex < block.text.length) {
      // Reveal next character
      const timer = setTimeout(() => {
        setCharIndex((c) => c + 1);
      }, charDelay);
      return () => clearTimeout(timer);
    } else {
      // Block complete — mark as revealed and move to next after delay
      setRevealedBlocks((prev) => new Set(prev).add(currentBlock));
      if (currentBlock < blocks.length - 1) {
        const timer = setTimeout(() => {
          setCurrentBlock((b) => b + 1);
          setCharIndex(0);
        }, blockDelay);
        return () => clearTimeout(timer);
      }
    }
  }, [currentBlock, charIndex, blocks, blockDelay, charDelay]);

  return (
    <div className="space-y-6">
      {heading && (
        <h1 className="text-2xl font-medium text-ink mb-8">{heading}</h1>
      )}

      {blocks.map((block, i) => {
        if (i > currentBlock) return null;
        const isRevealed = revealedBlocks.has(i);
        const isActive = i === currentBlock;

        return (
          <div
            key={i}
            className={`transition-opacity duration-300 ${
              isRevealed ? "opacity-100" : isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            <BlockContent
              block={block}
              revealed={isRevealed}
              charIndex={isActive ? charIndex : 0}
            />
          </div>
        );
      })}
    </div>
  );
}
