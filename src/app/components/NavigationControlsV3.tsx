"use client";

/**
 * NavigationControlsV3 — intent-driven navigation controls.
 *
 * Labels, icons, placement, and interaction mode rotate per step via
 * the deterministic IntentSpec. Non-click modes (hold, scroll) include
 * accessibility fallback after timeout.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { SessionPhase } from "../runtime/useShowSession";
import type { IntentSpec, InteractionMode, Placement } from "../runtime/types";

// ---------------------------------------------------------------------------
// Hold-to-continue button
// ---------------------------------------------------------------------------

const HOLD_DURATION_MS = 800;
const HOLD_FALLBACK_MS = 4000;
const PRIMARY_BUTTON_CLASS =
  "px-4 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-mono text-white border border-black rounded-lg cursor-pointer bg-black shadow-[0_8px_18px_rgba(0,0,0,0.28)] hover:-translate-y-[1px] hover:shadow-[0_12px_24px_rgba(0,0,0,0.32)] active:translate-y-0 active:shadow-[0_6px_14px_rgba(0,0,0,0.28)] transition-all duration-200";
const SECONDARY_BUTTON_CLASS =
  "px-3 py-1.5 sm:px-4 sm:py-2 text-[10px] sm:text-xs font-mono text-white bg-black/95 hover:bg-black border border-black rounded-md shadow-[0_5px_12px_rgba(0,0,0,0.22)] hover:-translate-y-[1px] transition-all duration-200 cursor-pointer";

function HoldButton({
  label,
  icon,
  onComplete,
}: {
  label: string;
  icon: string;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [fallback, setFallback] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(0);

  // Fallback to click after timeout
  useEffect(() => {
    const timer = setTimeout(() => setFallback(true), HOLD_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, []);

  const startHold = useCallback(() => {
    startTime.current = Date.now();
    holdTimer.current = setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const p = Math.min(elapsed / HOLD_DURATION_MS, 1);
      setProgress(p);
      if (p >= 1) {
        if (holdTimer.current) clearInterval(holdTimer.current);
        onComplete();
      }
    }, 16);
  }, [onComplete]);

  const endHold = useCallback(() => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    setProgress(0);
  }, []);

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearInterval(holdTimer.current);
    };
  }, []);

  if (fallback) {
    return (
      <button
        onClick={onComplete}
        className={PRIMARY_BUTTON_CLASS}
      >
        <span className="mr-1.5 text-xs opacity-80">{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <button
      onPointerDown={startHold}
      onPointerUp={endHold}
      onPointerLeave={endHold}
      className={`relative overflow-hidden select-none touch-none ${PRIMARY_BUTTON_CLASS}`}
      aria-label={`Hold to ${label}`}
    >
      {/* Progress fill */}
      <div
        className="absolute inset-0 bg-white/20 origin-left transition-none"
        style={{ transform: `scaleX(${progress})` }}
      />
      <span className="relative z-10 flex items-center gap-1.5">
        <span className="text-xs opacity-80">{icon}</span>
        <span>hold</span>
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Scroll-threshold button
// ---------------------------------------------------------------------------

const SCROLL_THRESHOLD = 60;
const SCROLL_FALLBACK_MS = 5000;

function ScrollTrigger({
  label,
  icon,
  onComplete,
}: {
  label: string;
  icon: string;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [fallback, setFallback] = useState(false);
  const accumulated = useRef(0);
  const completed = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setFallback(true), SCROLL_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, []);

  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (fallback || completed.current) return;

    const advance = (delta: number) => {
      accumulated.current = Math.min(
        accumulated.current + delta,
        SCROLL_THRESHOLD
      );
      const p = accumulated.current / SCROLL_THRESHOLD;
      setProgress(p);
      if (p >= 1 && !completed.current) {
        completed.current = true;
        onComplete();
      }
    };

    const wheelHandler = (e: WheelEvent) => {
      advance(Math.abs(e.deltaY));
    };

    const touchStartHandler = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };

    const touchMoveHandler = (e: TouchEvent) => {
      if (touchStartY.current === null) return;
      const delta = Math.abs(e.touches[0].clientY - touchStartY.current);
      touchStartY.current = e.touches[0].clientY;
      advance(delta);
    };

    const touchEndHandler = () => {
      touchStartY.current = null;
    };

    window.addEventListener("wheel", wheelHandler, { passive: true });
    window.addEventListener("touchstart", touchStartHandler, { passive: true });
    window.addEventListener("touchmove", touchMoveHandler, { passive: true });
    window.addEventListener("touchend", touchEndHandler, { passive: true });
    return () => {
      window.removeEventListener("wheel", wheelHandler);
      window.removeEventListener("touchstart", touchStartHandler);
      window.removeEventListener("touchmove", touchMoveHandler);
      window.removeEventListener("touchend", touchEndHandler);
    };
  }, [fallback, onComplete]);

  if (fallback) {
    return (
      <button
        onClick={onComplete}
        className={PRIMARY_BUTTON_CLASS}
      >
        <span className="mr-1.5 text-xs opacity-80">{icon}</span>
        {label}
      </button>
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${PRIMARY_BUTTON_CLASS}`}
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Scroll to ${label}`}
    >
      <div
        className="absolute inset-0 bg-white/20 origin-left transition-none"
        style={{ transform: `scaleX(${progress})` }}
      />
      <span className="relative z-10 flex items-center gap-1.5">
        <span className="text-xs opacity-80">{icon}</span>
        <span className="hidden sm:inline">scroll {"\u2193"}</span>
        <span className="sm:hidden">swipe {"\u2193"}</span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placement styles
// ---------------------------------------------------------------------------

const PLACEMENT_CLASSES: Record<Placement, string> = {
  "bottom-center": "fixed bottom-[4.75rem] sm:bottom-10 left-1/2 -translate-x-1/2 z-30",
  "right-rail": "fixed bottom-[4.75rem] right-3 sm:bottom-10 sm:right-6 z-30",
  "inline-anchor": "fixed bottom-[4.75rem] sm:bottom-10 left-1/2 -translate-x-1/2 z-30",
};

// ---------------------------------------------------------------------------
// Primary action button (click/tap mode)
// ---------------------------------------------------------------------------

function ActionButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={PRIMARY_BUTTON_CLASS}
    >
      <span className="mr-1.5 text-xs opacity-80">{icon}</span>
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// NavigationControlsV3
// ---------------------------------------------------------------------------

interface NavigationControlsV3Props {
  phase: SessionPhase;
  currentStep: number;
  totalConcepts: number;
  browsingIndex: number | null;
  interactionLocked?: boolean;
  intentSpec: IntentSpec;
  onShowPresentation: () => void;
  onAdvance: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
}

export default function NavigationControlsV3({
  phase,
  currentStep,
  totalConcepts,
  browsingIndex,
  interactionLocked = false,
  intentSpec,
  onShowPresentation,
  onAdvance,
  onGoBack,
  onGoForward,
}: NavigationControlsV3Props) {
  const isBrowsing = browsingIndex !== null;
  const isBlockedByPresentation = interactionLocked && !isBrowsing;
  const isLastConcept = currentStep >= totalConcepts - 1;
  const canGoBack = isBrowsing ? browsingIndex > 0 : currentStep > 0;

  const showControls =
    phase === "reasoning-done" ||
    phase === "awaiting" ||
    isBrowsing;

  if (!showControls || isBlockedByPresentation) return null;

  // Determine primary action and its handler
  let primaryAction: () => void;
  let primaryLabel: string;
  let useIntentMode: InteractionMode;

  if (isBrowsing) {
    primaryAction = onGoForward;
    primaryLabel = "continue";
    useIntentMode = "click"; // Always simple click when browsing
  } else if (phase === "reasoning-done") {
    primaryAction = onShowPresentation;
    primaryLabel = intentSpec.label;
    useIntentMode = intentSpec.interactionMode;
  } else if (phase === "awaiting") {
    primaryAction = onAdvance;
    primaryLabel = isLastConcept ? "fin" : intentSpec.label;
    useIntentMode = isLastConcept ? "click" : intentSpec.interactionMode;
  } else {
    primaryAction = onAdvance;
    primaryLabel = "continue";
    useIntentMode = "click";
  }

  // "tap" is visually identical to click
  if (useIntentMode === "tap") useIntentMode = "click";

  const placement = isBrowsing ? "bottom-center" : intentSpec.placement;

  // Render primary action based on interaction mode
  let primaryButton: React.ReactNode;
  switch (useIntentMode) {
    case "hold":
      primaryButton = (
        <HoldButton label={primaryLabel} icon={intentSpec.icon} onComplete={primaryAction} />
      );
      break;
    case "scroll":
      primaryButton = (
        <ScrollTrigger label={primaryLabel} icon={intentSpec.icon} onComplete={primaryAction} />
      );
      break;
    default:
      primaryButton = (
        <ActionButton label={primaryLabel} icon={intentSpec.icon} onClick={primaryAction} />
      );
  }

  return (
    <div className={`${PLACEMENT_CLASSES[placement]} max-w-[calc(100vw-1.5rem)] flex flex-wrap items-center justify-center gap-2 sm:gap-3`}>
      {/* Back button */}
      {canGoBack && (phase === "awaiting" || isBrowsing) && (
        <button onClick={onGoBack} className={SECONDARY_BUTTON_CLASS}>
          &larr; back
        </button>
      )}

      {primaryButton}

      {/* Keyboard accessibility: always allow Enter/Space on primary action */}
      {useIntentMode !== "click" && (
        <button
          onClick={primaryAction}
          className="sr-only focus:not-sr-only focus:px-3 focus:py-1.5 focus:text-xs focus:font-mono focus:text-white focus:bg-black focus:border focus:border-black focus:rounded"
          aria-label={primaryLabel}
        >
          {primaryLabel}
        </button>
      )}
    </div>
  );
}
