"use client";

/**
 * Session Store — localStorage persistence for v3 runtime.
 *
 * Persists StepPackets and token totals keyed by
 * `agent-face:v3:{sessionId}:{model}:{promptVersion}`.
 *
 * Features:
 * - 24h TTL with automatic expiry on read
 * - Cache-version invalidation on prompt/schema/model change
 * - Generate + restore session IDs
 */

import {
  type StepPacket,
  type TokenUsage,
  buildCacheKey,
  emptyTokenUsage,
  SESSION_CACHE_TTL_MS,
} from "./types";

// ---------------------------------------------------------------------------
// Persisted shape
// ---------------------------------------------------------------------------

interface PersistedSession {
  sessionId: string;
  model: string;
  promptVersion: string;
  packets: Record<number, StepPacket>;
  totals: TokenUsage;
  createdAt: number; // epoch ms
}

// ---------------------------------------------------------------------------
// Session ID generation
// ---------------------------------------------------------------------------

let sessionCounter = 0;

export function generateSessionId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  sessionCounter++;
  return `s-${ts}-${rand}-${sessionCounter}`;
}

// ---------------------------------------------------------------------------
// Read / Write
// ---------------------------------------------------------------------------

export function loadSession(
  sessionId: string,
  model: string,
  promptVersion: string
): PersistedSession | null {
  try {
    const key = buildCacheKey(sessionId, model, promptVersion);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed: PersistedSession = JSON.parse(raw);

    // TTL check
    if (Date.now() - parsed.createdAt > SESSION_CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: PersistedSession): void {
  try {
    const key = buildCacheKey(
      session.sessionId,
      session.model,
      session.promptVersion
    );
    localStorage.setItem(key, JSON.stringify(session));
  } catch {
    // localStorage full or unavailable — degrade silently
  }
}

export function createPersistedSession(
  sessionId: string,
  model: string,
  promptVersion: string
): PersistedSession {
  return {
    sessionId,
    model,
    promptVersion,
    packets: {},
    totals: emptyTokenUsage(),
    createdAt: Date.now(),
  };
}

// ---------------------------------------------------------------------------
// Packet-level operations
// ---------------------------------------------------------------------------

export function savePacket(
  sessionId: string,
  model: string,
  promptVersion: string,
  packet: StepPacket
): void {
  let session = loadSession(sessionId, model, promptVersion);
  if (!session) {
    session = createPersistedSession(sessionId, model, promptVersion);
  }
  session.packets[packet.stepIndex] = packet;
  saveSession(session);
}

export function getPacket(
  sessionId: string,
  model: string,
  promptVersion: string,
  stepIndex: number
): StepPacket | null {
  const session = loadSession(sessionId, model, promptVersion);
  return session?.packets[stepIndex] ?? null;
}

export function updateTotals(
  sessionId: string,
  model: string,
  promptVersion: string,
  totals: TokenUsage
): void {
  const session = loadSession(sessionId, model, promptVersion);
  if (!session) return;
  session.totals = totals;
  saveSession(session);
}

// ---------------------------------------------------------------------------
// Cleanup — remove expired sessions
// ---------------------------------------------------------------------------

export function cleanExpiredSessions(): void {
  try {
    const prefix = "agent-face:v3:";
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;

      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed: PersistedSession = JSON.parse(raw);
        if (Date.now() - parsed.createdAt > SESSION_CACHE_TTL_MS) {
          keysToRemove.push(key);
        }
      } catch {
        keysToRemove.push(key!);
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // Degrade silently
  }
}
