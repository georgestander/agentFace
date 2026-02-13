"use client";

/**
 * HomeV3 — v3 runtime-powered home page.
 *
 * Single owner of useShowSession. Passes session state down to
 * StageV3, ConceptBoxV3. Manages prefetch and token telemetry.
 */

import { useState, useEffect } from "react";
import { useShowSession } from "../runtime/useShowSession";
import { useStepPrefetch } from "../runtime/useStepPrefetch";
import { useTokenLedger } from "../runtime/useTokenLedger";
import StageV3 from "../components/StageV3";
import ConceptBoxV3 from "../components/ConceptBoxV3";
import IntroScreenV3 from "../components/IntroScreenV3";
import FinScreen from "../components/FinScreen";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function HomeV3() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="relative h-screen w-screen overflow-hidden bg-surface">
        <Header visible />
        <Footer visible />
        <IntroScreenV3 onStart={() => setStarted(true)} />
      </div>
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

  // Record token usage when a packet arrives
  useEffect(() => {
    if (session.currentPacket?.tokenUsage) {
      tokenLedger.record(
        session.currentPacket.stepIndex,
        session.currentPacket.tokenUsage
      );
    }
  }, [session.currentPacket]);

  const isComplete = session.phase === "complete";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-surface">
      <Header visible />
      <Footer visible />

      <ConceptBoxV3
        currentStep={session.currentStep}
        phase={session.phase}
        browsingIndex={session.browsingIndex}
        onBrowseTo={session.browseTo}
      />

      {isComplete ? (
        <FinScreen />
      ) : (
        <StageV3 session={session} />
      )}

      {/* Token telemetry badge */}
      {tokenLedger.totals.totalTokens > 0 && (
        <div className="fixed bottom-2 right-4 z-10 font-mono text-[10px] text-ink-faint opacity-60">
          {tokenLedger.totals.totalTokens.toLocaleString()} tokens
        </div>
      )}
    </div>
  );
}
