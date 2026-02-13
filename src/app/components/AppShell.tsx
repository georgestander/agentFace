"use client";

/**
 * AppShell — global layout wrapper for all pages.
 *
 * Provides consistent Header + Footer on every route. Supports
 * full-screen mode (performance canvas) and content mode (scrollable pages).
 */

import Header from "./Header";
import Footer from "./Footer";

interface AppShellProps {
  children: React.ReactNode;
  /** Full-screen fixed viewport (performance canvas) */
  fullScreen?: boolean;
}

export default function AppShell({ children, fullScreen = false }: AppShellProps) {
  return (
    <div
      className={
        fullScreen
          ? "relative h-screen w-screen overflow-hidden bg-surface"
          : "min-h-screen bg-surface"
      }
    >
      <Header visible />
      <Footer visible />
      {children}
    </div>
  );
}
