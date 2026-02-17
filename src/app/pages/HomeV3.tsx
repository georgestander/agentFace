"use client";

/**
 * HomeV3 — v3 runtime-powered home page.
 *
 * Single owner of useShowSession. Passes session state down to
 * StageV3, ConceptBoxV3. Manages prefetch and token telemetry.
 */

import { useState, useEffect, useRef } from "react";
import { useShowSession } from "../runtime/useShowSession";
import { useStepPrefetch } from "../runtime/useStepPrefetch";
import { useTokenLedger } from "../runtime/useTokenLedger";
import type { TokenUsage } from "../runtime/types";
import { getSnapshot } from "../runtime/thread-store";
import { loadActiveSession, loadSession } from "../runtime/session-store";
import StageV3 from "../components/StageV3";
import ConceptBoxV3 from "../components/ConceptBoxV3";
import IntroScreenV3 from "../components/IntroScreenV3";
import FinScreenV3 from "../components/FinScreenV3";
import AppShell from "../components/AppShell";

export default function HomeV3() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started) return;

    const params = new URLSearchParams(window.location.search);
    const replayRequested = params.get("replay") === "1";
    if (!replayRequested) return;

    const activeRef = loadActiveSession();
    if (!activeRef) return;

    const persisted = loadSession(
      activeRef.sessionId,
      activeRef.model,
      activeRef.promptVersion
    );

    if (!persisted || Object.keys(persisted.packets).length === 0) return;

    setStarted(true);
    window.history.replaceState({}, "", "/");
  }, [started]);

  if (!started) {
    return (
      <AppShell fullScreen backdrop="scanline">
        <IntroScreenV3 onStart={() => setStarted(true)} />
      </AppShell>
    );
  }

  return <HomeV3Active />;
}

function HomeV3Active() {
  const session = useShowSession();
  const tokenLedger = useTokenLedger();

  // Start session on mount
  useEffect(() => {
    if (session.phase === "init") {
      session.startSession();
    }
  }, [session.phase, session.startSession]);

  // Hydrate token ledger from restored session (e.g. after refresh)
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || session.phase === "init" || !session.sessionId) return;
    const snapshot = getSnapshot();
    if (!snapshot) return;

    const byStep: Record<number, TokenUsage> = {};
    for (const [key, packet] of Object.entries(snapshot.packetsByStep)) {
      if (packet.tokenUsage) {
        byStep[Number(key)] = packet.tokenUsage;
      }
    }
    if (Object.keys(byStep).length > 0 && snapshot.totals.totalTokens > 0) {
      tokenLedger.hydrate(byStep, snapshot.totals);
    }
    hydratedRef.current = true;
  }, [session.phase, session.sessionId]);

  // Prefetch upcoming steps after a packet arrives
  const prefetchEnabled =
    session.phase === "reasoning-done" ||
    session.phase === "presenting" ||
    session.phase === "awaiting";

  useStepPrefetch({
    sessionId: session.sessionId,
    model: session.model,
    completedStep: session.currentStep,
    totalConcepts: session.totalConcepts,
    enabled: prefetchEnabled && !!session.currentPacket,
  });

  // Record token usage when a NEW packet arrives (not on browse transitions).
  // Track which steps have been recorded to avoid double-counting.
  const recordedStepsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    const packet = session.currentPacket;
    if (
      packet?.tokenUsage &&
      session.browsingIndex === null &&
      !recordedStepsRef.current.has(packet.stepIndex)
    ) {
      recordedStepsRef.current.add(packet.stepIndex);
      tokenLedger.record(packet.stepIndex, packet.tokenUsage);
    }
  }, [session.currentPacket, session.browsingIndex]);

  const backdrop = "scanline" as const;

  const isComplete = session.phase === "complete";

  return (
    <AppShell fullScreen backdrop={backdrop}>
      <ConceptBoxV3
        currentStep={session.currentStep}
        phase={session.phase}
        browsingIndex={session.browsingIndex}
        onBrowseTo={session.browseTo}
      />

      {isComplete ? (
        <FinScreenV3
          totalTokens={tokenLedger.totals.totalTokens}
          averagePerStep={tokenLedger.averagePerStep}
          stepCount={Object.keys(tokenLedger.byStep).length}
        />
      ) : (
        <StageV3 session={session} />
      )}

      {/* Token telemetry badge */}
      {tokenLedger.totals.totalTokens > 0 && (
        <div className="hidden sm:block fixed bottom-2 right-4 z-10 font-mono text-[10px] text-ink-faint opacity-60">
          {tokenLedger.totals.totalTokens.toLocaleString()} tokens
        </div>
      )}
    </AppShell>
  );
}
