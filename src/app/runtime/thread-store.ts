"use client";

/**
 * Thread Store — in-memory step packet management for the current session.
 *
 * Sits between the session-store (localStorage) and the React hooks.
 * Tracks which steps have packets, which are in-flight, and the prefetch queue.
 * Syncs writes through to session-store for persistence.
 */

import {
  type StepPacket,
  type TokenUsage,
  type SessionShowState,
  emptyTokenUsage,
} from "./types";
import {
  savePacket as persistPacket,
  updateTotals as persistTotals,
  loadSession,
  type PersistedSession,
} from "./session-store";

// ---------------------------------------------------------------------------
// Thread state
// ---------------------------------------------------------------------------

interface ThreadState {
  sessionId: string;
  model: string;
  promptVersion: string;
  currentStep: number;
  packetsByStep: Record<number, StepPacket>;
  inflightByStep: Record<number, boolean>;
  prefetchQueue: number[];
  totals: TokenUsage;
}

let _state: ThreadState | null = null;
let _listeners: Array<() => void> = [];

function notify(): void {
  for (const fn of _listeners) fn();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function subscribe(listener: () => void): () => void {
  _listeners.push(listener);
  return () => {
    _listeners = _listeners.filter((l) => l !== listener);
  };
}

export function getSnapshot(): SessionShowState | null {
  if (!_state) return null;
  return {
    sessionId: _state.sessionId,
    currentStep: _state.currentStep,
    packetsByStep: _state.packetsByStep,
    prefetchQueue: _state.prefetchQueue,
    inflightByStep: _state.inflightByStep,
    totals: _state.totals,
  };
}

/**
 * Initialize the thread store for a session.
 * Hydrates from localStorage if a persisted session exists.
 */
export function initThread(
  sessionId: string,
  model: string,
  promptVersion: string
): void {
  const persisted: PersistedSession | null = loadSession(
    sessionId,
    model,
    promptVersion
  );

  _state = {
    sessionId,
    model,
    promptVersion,
    currentStep: 0,
    packetsByStep: persisted?.packets ?? {},
    inflightByStep: {},
    prefetchQueue: [],
    totals: persisted?.totals ?? emptyTokenUsage(),
  };
  notify();
}

export function destroyThread(): void {
  _state = null;
  _listeners = [];
}

// ---------------------------------------------------------------------------
// Step operations
// ---------------------------------------------------------------------------

export function hasPacket(stepIndex: number): boolean {
  return !!_state?.packetsByStep[stepIndex];
}

export function getPacket(stepIndex: number): StepPacket | undefined {
  return _state?.packetsByStep[stepIndex];
}

export function setCurrentStep(step: number): void {
  if (!_state) return;
  _state.currentStep = step;
  notify();
}

export function markInflight(stepIndex: number): void {
  if (!_state) return;
  _state.inflightByStep[stepIndex] = true;
  notify();
}

export function clearInflight(stepIndex: number): void {
  if (!_state) return;
  delete _state.inflightByStep[stepIndex];
  notify();
}

export function isInflight(stepIndex: number): boolean {
  return !!_state?.inflightByStep[stepIndex];
}

/**
 * Store a completed packet and persist to localStorage.
 * If the step was already stored, replaces the packet but does NOT
 * re-add token usage to totals (prevents overcounting).
 */
export function storePacket(packet: StepPacket): void {
  if (!_state) return;

  const alreadyStored = !!_state.packetsByStep[packet.stepIndex];
  _state.packetsByStep[packet.stepIndex] = packet;
  delete _state.inflightByStep[packet.stepIndex];

  // Only add to running totals for NEW steps (not re-stores)
  if (!alreadyStored && packet.tokenUsage) {
    _state.totals = {
      promptTokens: _state.totals.promptTokens + packet.tokenUsage.promptTokens,
      completionTokens:
        _state.totals.completionTokens + packet.tokenUsage.completionTokens,
      reasoningTokens:
        (_state.totals.reasoningTokens ?? 0) +
        (packet.tokenUsage.reasoningTokens ?? 0),
      totalTokens: _state.totals.totalTokens + packet.tokenUsage.totalTokens,
      provider: packet.tokenUsage.provider || _state.totals.provider,
    };
  }

  // Persist to localStorage
  persistPacket(
    _state.sessionId,
    _state.model,
    _state.promptVersion,
    packet
  );
  persistTotals(
    _state.sessionId,
    _state.model,
    _state.promptVersion,
    _state.totals
  );

  notify();
}

// ---------------------------------------------------------------------------
// Prefetch queue
// ---------------------------------------------------------------------------

export function setPrefetchQueue(steps: number[]): void {
  if (!_state) return;
  _state.prefetchQueue = steps;
  notify();
}

export function dequeuePrefetch(): number | undefined {
  if (!_state || _state.prefetchQueue.length === 0) return undefined;
  const next = _state.prefetchQueue.shift();
  notify();
  return next;
}

export function clearPrefetchQueue(): void {
  if (!_state) return;
  _state.prefetchQueue = [];
  notify();
}
