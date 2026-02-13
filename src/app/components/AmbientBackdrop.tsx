"use client";

/**
 * AmbientBackdrop — monochrome animated texture background.
 *
 * Variants: grain, scanline, grid-drift, static-noise.
 * Seeded by session for deterministic selection.
 * Respects prefers-reduced-motion.
 */

import { useEffect, useState } from "react";
import type { BackgroundVariant } from "../runtime/seed";

interface AmbientBackdropProps {
  variant: BackgroundVariant;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ---------------------------------------------------------------------------
// Grain — SVG noise filter overlay
// ---------------------------------------------------------------------------

function GrainBackdrop({ animate }: { animate: boolean }) {
  return (
    <>
      <svg className="hidden">
        <filter id="ambient-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          filter: "url(#ambient-grain)",
          opacity: 0.04,
          ...(animate
            ? { animation: "ambient-drift 8s linear infinite" }
            : {}),
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Scanline — horizontal line sweep
// ---------------------------------------------------------------------------

function ScanlineBackdrop({ animate }: { animate: boolean }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.02) 2px, rgba(0,0,0,0.02) 4px)",
        }}
      />
      {animate && (
        <div
          className="absolute left-0 right-0 h-[2px] bg-ink-faint/5"
          style={{
            animation: "ambient-scan 4s linear infinite",
          }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grid drift — subtle moving grid
// ---------------------------------------------------------------------------

function GridDriftBackdrop({ animate }: { animate: boolean }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,0,0,0.015) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.015) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        ...(animate
          ? { animation: "ambient-grid-drift 20s linear infinite" }
          : {}),
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Static noise — pseudo-random noise via gradient
// ---------------------------------------------------------------------------

function StaticNoiseBackdrop({ animate }: { animate: boolean }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        backgroundSize: "256px 256px",
        ...(animate
          ? { animation: "ambient-noise 0.5s steps(4) infinite" }
          : {}),
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// AmbientBackdrop
// ---------------------------------------------------------------------------

const VARIANTS: Record<BackgroundVariant, React.FC<{ animate: boolean }>> = {
  grain: GrainBackdrop,
  scanline: ScanlineBackdrop,
  "grid-drift": GridDriftBackdrop,
  "static-noise": StaticNoiseBackdrop,
};

export default function AmbientBackdrop({ variant }: AmbientBackdropProps) {
  const reducedMotion = useReducedMotion();
  const Variant = VARIANTS[variant] || GrainBackdrop;

  return <Variant animate={!reducedMotion} />;
}
