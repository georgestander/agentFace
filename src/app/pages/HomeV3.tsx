"use client";

/**
 * HomeV3 — v3 runtime-powered home page.
 *
 * Single owner of useShowSession. Passes session state down to
 * StageV3, ConceptBoxV3. Manages prefetch and token telemetry.
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useShowSession } from "../runtime/useShowSession";
import { useStepPrefetch } from "../runtime/useStepPrefetch";
import { useTokenLedger } from "../runtime/useTokenLedger";
import { buildSeed, deriveBackground } from "../runtime/seed";
import { PROMPT_VERSION } from "../runtime/types";
import { CONCEPTS } from "../agent/concepts";
import StageV3 from "../components/StageV3";
import ConceptBoxV3 from "../components/ConceptBoxV3";
import IntroScreenV3 from "../components/IntroScreenV3";
import FinScreenV3 from "../components/FinScreenV3";
import AppShell from "../components/AppShell";

export default function HomeV3() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <AppShell fullScreen>
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

  // Session-level backdrop variant
  const backdrop = useMemo(() => {
    if (!session.sessionId || !session.model) return "grain" as const;
    const seed = buildSeed(session.sessionId, 0, CONCEPTS[0].id, PROMPT_VERSION, session.model);
    return deriveBackground(seed);
  }, [session.sessionId, session.model]);

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
        <div className="fixed bottom-2 right-4 z-10 font-mono text-[10px] text-ink-faint opacity-60">
          {tokenLedger.totals.totalTokens.toLocaleString()} tokens
        </div>
      )}
    </AppShell>
  );
}
