"use client";

/**
 * AppShell — global layout wrapper for all pages.
 *
 * Provides consistent Header + Footer + AmbientBackdrop on every route.
 * Supports full-screen mode (performance canvas) and content mode
 * (scrollable pages).
 */

import Header from "./Header";
import Footer from "./Footer";
import AmbientBackdrop from "./AmbientBackdrop";
import type { BackgroundVariant } from "../runtime/seed";

interface AppShellProps {
  children: React.ReactNode;
  /** Full-screen fixed viewport (performance canvas) */
  fullScreen?: boolean;
  /** Background variant (defaults to "grain") */
  backdrop?: BackgroundVariant;
}

export default function AppShell({
  children,
  fullScreen = false,
  backdrop = "grain",
}: AppShellProps) {
  return (
    <div
      className={
        fullScreen
          ? "relative h-screen w-screen overflow-hidden bg-surface"
          : "relative min-h-screen bg-surface"
      }
    >
      <AmbientBackdrop variant={backdrop} />
      <Header visible />
      <Footer visible />
      {children}
    </div>
  );
}
