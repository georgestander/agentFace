"use client";

/**
 * Tab Sync — BroadcastChannel + localStorage lock
 *
 * Prevents duplicate generation for the same session/step across tabs.
 *
 * Lock protocol:
 * - Canonical lock lives in localStorage: `perf_v3_lock:{sessionId}:{stepIndex}`
 * - Lock value: `{ ownerTabId, expiresAt }`
 * - Acquire: if no lock or expired → take it. If another live tab holds it → wait.
 * - BroadcastChannel `agent-face-v3` carries packet-ready and lock-release messages.
 */

import type { StepPacket } from "./types";

// ---------------------------------------------------------------------------
// Tab identity
// ---------------------------------------------------------------------------

const TAB_ID =
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// ---------------------------------------------------------------------------
// Lock
// ---------------------------------------------------------------------------

const LOCK_TTL_MS = 90_000; // 90s — generous for slow models
const LOCK_PREFIX = "perf_v3_lock:";

interface LockValue {
  ownerTabId: string;
  expiresAt: number;
}

function lockKey(sessionId: string, stepIndex: number): string {
  return `${LOCK_PREFIX}${sessionId}:${stepIndex}`;
}

function readLock(sessionId: string, stepIndex: number): LockValue | null {
  try {
    const raw = localStorage.getItem(lockKey(sessionId, stepIndex));
    if (!raw) return null;
    return JSON.parse(raw) as LockValue;
  } catch {
    return null;
  }
}

function writeLock(sessionId: string, stepIndex: number): void {
  const value: LockValue = {
    ownerTabId: TAB_ID,
    expiresAt: Date.now() + LOCK_TTL_MS,
  };
  try {
    localStorage.setItem(lockKey(sessionId, stepIndex), JSON.stringify(value));
  } catch {
    // Degrade silently
  }
}

function releaseLock(sessionId: string, stepIndex: number): void {
  try {
    localStorage.removeItem(lockKey(sessionId, stepIndex));
  } catch {
    // Degrade silently
  }
}

/**
 * Try to acquire the generation lock for a step.
 * Returns true if this tab should generate, false if another tab owns it.
 *
 * Uses CAS emulation: write our lock, then immediately re-read and verify
 * we still own it. If another tab overwrote us in the gap, we lost the race.
 */
export function acquireLock(sessionId: string, stepIndex: number): boolean {
  const existing = readLock(sessionId, stepIndex);

  if (existing && Date.now() < existing.expiresAt) {
    if (existing.ownerTabId === TAB_ID) {
      // We already own it (e.g. retry)
      return true;
    }
    // Another tab holds a live lock
    return false;
  }

  // No lock or expired — attempt to acquire with CAS verification
  writeLock(sessionId, stepIndex);

  // Re-read immediately to verify we won the race
  const verification = readLock(sessionId, stepIndex);
  if (!verification || verification.ownerTabId !== TAB_ID) {
    // Another tab overwrote us — we lost the race
    return false;
  }

  return true;
}

export function releaseStepLock(sessionId: string, stepIndex: number): void {
  releaseLock(sessionId, stepIndex);
}

// ---------------------------------------------------------------------------
// BroadcastChannel
// ---------------------------------------------------------------------------

const CHANNEL_NAME = "agent-face-v3";

type SyncMessage =
  | { type: "packet-ready"; sessionId: string; stepIndex: number; packet: StepPacket }
  | { type: "lock-released"; sessionId: string; stepIndex: number };

let _channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!_channel) {
    _channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return _channel;
}

/**
 * Broadcast that a packet is ready for a step.
 */
export function broadcastPacketReady(
  sessionId: string,
  stepIndex: number,
  packet: StepPacket
): void {
  const ch = getChannel();
  if (!ch) return;
  const msg: SyncMessage = { type: "packet-ready", sessionId, stepIndex, packet };
  ch.postMessage(msg);
}

/**
 * Broadcast that a lock has been released.
 */
export function broadcastLockReleased(
  sessionId: string,
  stepIndex: number
): void {
  const ch = getChannel();
  if (!ch) return;
  const msg: SyncMessage = { type: "lock-released", sessionId, stepIndex };
  ch.postMessage(msg);
}

/**
 * Subscribe to cross-tab sync messages.
 * Returns an unsubscribe function.
 */
export function onSyncMessage(
  handler: (msg: SyncMessage) => void
): () => void {
  const ch = getChannel();
  if (!ch) return () => {};

  const listener = (event: MessageEvent) => {
    if (event.data && typeof event.data.type === "string") {
      handler(event.data as SyncMessage);
    }
  };
  ch.addEventListener("message", listener);
  return () => ch.removeEventListener("message", listener);
}

/**
 * Clean up the broadcast channel on teardown.
 */
export function destroyTabSync(): void {
  if (_channel) {
    _channel.close();
    _channel = null;
  }
}
