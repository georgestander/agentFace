"use client";

/**
 * StageV3 — v3 runtime-powered stage component.
 *
 * Receives all session state as props from HomeV3. Handles presentation
 * rendering, reasoning display, error states, and navigation controls.
 */

import type { ShowSessionState, ShowSessionActions } from "../runtime/useShowSession";
import ReasoningTrace from "./ReasoningTrace";
import ToolRenderer from "./ToolRenderer";
import NavigationControlsV3 from "./NavigationControlsV3";

function ThinkingDots() {
  return (
    <div className="flex items-center justify-center gap-1.5 text-ink-faint" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => {
        const delay = `${index * 120}ms`;
        return (
          <span
            key={index}
            className="block w-1 h-1 rounded-full bg-ink-faint"
            style={{
              animation: "thinking-dot 1s infinite",
              animationDelay: delay,
            }}
          />
        );
      })}
    </div>
  );
}

interface StageV3Props {
  session: ShowSessionState & ShowSessionActions;
}

export default function StageV3({ session }: StageV3Props) {
  const isBrowsing = session.browsingIndex !== null;
  const browsingPacket = isBrowsing ? session.currentPacket : null;

  // Determine reasoning display
  const showReasoning =
    isBrowsing ||
    session.phase === "reasoning" ||
    session.phase === "reasoning-done";

  const reasoningText = isBrowsing
    ? browsingPacket?.thoughtFull || ""
    : session.thoughtDelta;

  // Determine presentation display
  const displayPresentation = session.currentPacket
    ? { toolName: session.currentPacket.toolName, props: session.currentPacket.toolProps }
    : null;

  const showPresentation = isBrowsing
    ? !!browsingPacket
    : (session.phase === "presenting" || session.phase === "awaiting") &&
      !!displayPresentation;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {showPresentation && displayPresentation && (
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            isBrowsing || session.phase === "presenting" || session.phase === "awaiting"
              ? "opacity-100"
              : "opacity-0"
          }`}
        >
          <ToolRenderer
            key={
              isBrowsing
                ? `history-${session.browsingIndex}`
                : `current-${session.currentStep}`
            }
            name={displayPresentation.toolName}
            props={displayPresentation.props}
            onReady={isBrowsing ? undefined : session.finishPresentation}
          />
        </div>
      )}

      {/* Reasoning trace */}
      {showReasoning && (
        <div className="absolute left-1/2 bottom-24 z-20 w-full -translate-x-1/2 px-6 text-center">
          <div
            className={`mx-auto w-fit transition-all duration-500 ${
              isBrowsing
                ? "opacity-90"
                : session.phase === "presenting"
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
            }`}
          >
            <ReasoningTrace
              text={reasoningText}
              isActive={session.phase === "reasoning"}
              collapsed={isBrowsing}
            />
          </div>
          {session.phase === "reasoning" && <ThinkingDots />}
        </div>
      )}

      {/* Navigation controls */}
      <NavigationControlsV3
        phase={session.phase}
        currentStep={session.currentStep}
        totalConcepts={session.totalConcepts}
        browsingIndex={session.browsingIndex}
        onShowPresentation={session.showPresentation}
        onAdvance={session.advance}
        onGoBack={session.goBack}
        onGoForward={session.goForward}
      />

      {/* Error state */}
      {session.phase === "error" && !isBrowsing && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-surface/60 backdrop-blur-sm">
          <p className="text-ink-muted font-mono text-sm">{session.errorMessage}</p>
          <button
            onClick={session.clearError}
            className="px-4 py-2 text-xs font-mono text-ink-muted hover:text-ink border border-stone-300 rounded-lg transition-colors cursor-pointer"
          >
            try again
          </button>
        </div>
      )}
    </div>
  );
}
