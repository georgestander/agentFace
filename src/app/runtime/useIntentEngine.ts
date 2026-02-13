"use client";

/**
 * useIntentEngine — derives IntentSpec from deterministic seed per step.
 *
 * For Phases 1-6 the model does not return intent metadata, so this
 * hook always derives from seed. Phase 7 will add model-preferred
 * intent with seed as fallback.
 */

import { useMemo } from "react";
import { type IntentSpec, type UiMood, PROMPT_VERSION } from "./types";
import { buildSeed, deriveMood, deriveIntent } from "./seed";

interface IntentEngineResult {
  mood: UiMood;
  intent: IntentSpec;
  seed: number;
}

export function useIntentEngine(
  sessionId: string,
  stepIndex: number,
  conceptId: string,
  model: string,
  previousMood?: UiMood
): IntentEngineResult {
  return useMemo(() => {
    const seed = buildSeed(sessionId, stepIndex, conceptId, PROMPT_VERSION, model);
    const mood = deriveMood(seed, previousMood);
    const intent = deriveIntent(seed);
    return { mood, intent, seed };
  }, [sessionId, stepIndex, conceptId, model, previousMood]);
}
