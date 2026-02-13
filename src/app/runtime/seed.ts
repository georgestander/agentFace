/**
 * Deterministic seed engine
 *
 * Produces a numeric seed from session+step+concept+prompt+model so that
 * UiMood, intent labels, placement, interaction mode, icon, and background
 * variant are stable across revisits and refreshes.
 */

import {
  UI_MOODS,
  INTERACTION_MODES,
  PLACEMENTS,
  type UiMood,
  type IntentSpec,
} from "./types";

// ---------------------------------------------------------------------------
// Hash — simple FNV-1a 32-bit (no crypto dependency, browser + worker safe)
// ---------------------------------------------------------------------------

function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // unsigned 32-bit
}

/**
 * Build a canonical seed from session context.
 * Returns a positive 32-bit integer.
 */
export function buildSeed(
  sessionId: string,
  stepIndex: number,
  conceptId: string,
  promptVersion: string,
  model: string
): number {
  const raw = `${sessionId}:${stepIndex}:${conceptId}:${promptVersion}:${model}`;
  return fnv1a32(raw);
}

// ---------------------------------------------------------------------------
// Deterministic selectors — pick from an array using the seed
// ---------------------------------------------------------------------------

function pick<T>(seed: number, items: readonly T[], offset = 0): T {
  const index = (seed + offset) % items.length;
  return items[index >= 0 ? index : index + items.length];
}

// ---------------------------------------------------------------------------
// Intent labels — rotate per step
// ---------------------------------------------------------------------------

const INTENT_LABELS = [
  "continue",
  "go deeper",
  "unfold",
  "decode next",
  "advance thread",
] as const;

// ---------------------------------------------------------------------------
// Icon set — monochrome ASCII/line icons
// ---------------------------------------------------------------------------

const ICONS = [
  "→",
  "▶",
  "↳",
  "⟩",
  "◈",
] as const;

// ---------------------------------------------------------------------------
// Collision guard: avoid repeating the same mood for consecutive steps.
// If the seeded mood matches `previousMood`, re-derive with offset.
// ---------------------------------------------------------------------------

export function deriveMood(seed: number, previousMood?: UiMood): UiMood {
  let mood = pick(seed, UI_MOODS);
  if (previousMood && mood === previousMood) {
    mood = pick(seed, UI_MOODS, 1);
    // If still collides (only possible when array length <= 2), bump again
    if (mood === previousMood) {
      mood = pick(seed, UI_MOODS, 2);
    }
  }
  return mood;
}

/**
 * Derive a full IntentSpec from the seed.
 */
export function deriveIntent(seed: number): IntentSpec {
  return {
    label: pick(seed, INTENT_LABELS),
    interactionMode: pick(seed, INTERACTION_MODES, 3),
    placement: pick(seed, PLACEMENTS, 7),
    icon: pick(seed, ICONS, 11),
  };
}

// ---------------------------------------------------------------------------
// Thought style variant — deterministic per step
// ---------------------------------------------------------------------------

export const THOUGHT_STYLES = [
  "ticker",
  "pulse-line",
  "terminal-ledger",
  "dossier-note",
] as const;

export type ThoughtStyle = (typeof THOUGHT_STYLES)[number];

export function deriveThoughtStyle(
  seed: number,
  previousStyle?: ThoughtStyle
): ThoughtStyle {
  let style = pick(seed, THOUGHT_STYLES, 13);
  if (previousStyle && style === previousStyle) {
    style = pick(seed, THOUGHT_STYLES, 14);
    if (style === previousStyle) {
      style = pick(seed, THOUGHT_STYLES, 15);
    }
  }
  return style;
}

// ---------------------------------------------------------------------------
// Background variant (for AmbientBackdrop — Phase 6, but seed is ready now)
// ---------------------------------------------------------------------------

export const BACKGROUND_VARIANTS = [
  "grain",
  "scanline",
  "grid-drift",
  "static-noise",
] as const;

export type BackgroundVariant = (typeof BACKGROUND_VARIANTS)[number];

export function deriveBackground(seed: number): BackgroundVariant {
  return pick(seed, BACKGROUND_VARIANTS, 5);
}
