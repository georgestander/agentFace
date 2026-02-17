"use client";

/**
 * StreamedCopy — staccato text reveal for static page content.
 *
 * No inference required. Deterministic client-side animation that
 * reveals content blocks with a light staccato effect.
 */

import { useState, useEffect, useRef, type ReactNode } from "react";

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

const INLINE_LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;

function isSafeHref(href: string): boolean {
  const normalized = href.trim().toLowerCase();
  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("mailto:")
  );
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let linkCount = 0;

  for (const match of text.matchAll(INLINE_LINK_PATTERN)) {
    const index = match.index ?? -1;
    const full = match[0];
    const label = match[1];
    const href = match[2];
    if (index < 0) continue;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    if (isSafeHref(href)) {
      const external = href.startsWith("http://") || href.startsWith("https://");
      nodes.push(
        <a
          key={`inline-link-${index}-${linkCount}`}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noreferrer noopener" : undefined}
          className="underline decoration-stone-400 underline-offset-2 hover:text-ink transition-colors"
        >
          {label}
        </a>
      );
    } else {
      nodes.push(full);
    }

    lastIndex = index + full.length;
    linkCount += 1;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
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
  const inlineText = renderInlineMarkdown(text);
  const showCursor = !revealed && charIndex < block.text.length;

  const cursor = showCursor ? (
    <span className="inline-block w-[1px] h-[1em] bg-ink-muted align-text-bottom ml-0.5 animate-pulse" />
  ) : null;

  switch (block.type) {
    case "p":
      return (
        <p className="text-sm text-ink-muted leading-relaxed">
          {inlineText}
          {cursor}
        </p>
      );
    case "li":
      return (
        <li className="text-sm text-ink-muted leading-relaxed pl-4 border-l-2 border-stone-200">
          {inlineText}
          {cursor}
        </li>
      );
    case "quote":
      return (
        <blockquote className="text-sm text-ink-faint leading-relaxed italic pl-4 border-l-2 border-accent-light">
          {inlineText}
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
