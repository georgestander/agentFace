/**
 * V3 Runtime Types
 *
 * Core types for the Tambo-inspired session/step runtime.
 */

// ---------------------------------------------------------------------------
// UiMood
// ---------------------------------------------------------------------------

export const UI_MOODS = [
  "command-grid",
  "dossier",
  "telemetry",
  "wireframe",
  "manifesto",
] as const;

export type UiMood = (typeof UI_MOODS)[number];

// ---------------------------------------------------------------------------
// Interaction modes & placements
// ---------------------------------------------------------------------------

export const INTERACTION_MODES = ["click", "tap", "scroll", "hold"] as const;
export type InteractionMode = (typeof INTERACTION_MODES)[number];

export const PLACEMENTS = ["bottom-center", "right-rail", "inline-anchor"] as const;
export type Placement = (typeof PLACEMENTS)[number];

// ---------------------------------------------------------------------------
// IntentSpec
// ---------------------------------------------------------------------------

export interface IntentSpec {
  label: string;
  interactionMode: InteractionMode;
  placement: Placement;
  icon: string;
}

// ---------------------------------------------------------------------------
// TokenUsage
// ---------------------------------------------------------------------------

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  reasoningTokens?: number;
  totalTokens: number;
  provider: string;
}

// ---------------------------------------------------------------------------
// StepPacket
// ---------------------------------------------------------------------------

export interface StepPacket {
  sessionId: string;
  stepIndex: number;
  conceptId: string;
  toolName: string;
  toolProps: Record<string, unknown>;
  toolCallId: string;
  thoughtShort: string;
  thoughtFull: string;
  uiMood: UiMood;
  intentSpec: IntentSpec;
  tokenUsage: TokenUsage | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// SessionShowState
// ---------------------------------------------------------------------------

export interface SessionShowState {
  sessionId: string;
  currentStep: number;
  packetsByStep: Record<number, StepPacket>;
  prefetchQueue: number[];
  inflightByStep: Record<number, boolean>;
  totals: TokenUsage;
}

// ---------------------------------------------------------------------------
// Session start / step request shapes
// ---------------------------------------------------------------------------

export interface SessionStartRequest {
  sessionId?: string;
  model: string;
  promptVersion: string;
}

export interface SessionStartResponse {
  sessionId: string;
  model: string;
  totalConcepts: number;
  cacheVersion: string;
  startedAt: string;
}

export interface SessionStepRequest {
  sessionId: string;
  stepIndex: number;
  mode: "interactive" | "prefetch";
  priorSteps: number[];
  usedTools: string[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PROMPT_VERSION = "v3.0";
export const SCHEMA_VERSION = "v3.0";
export const SESSION_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Build the cache key for a session in localStorage */
export function buildCacheKey(
  sessionId: string,
  model: string,
  promptVersion: string
): string {
  return `agent-face:v3:${sessionId}:${model}:${promptVersion}`;
}

/** Create an empty TokenUsage */
export function emptyTokenUsage(): TokenUsage {
  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    provider: "",
  };
}
