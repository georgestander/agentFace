"use client";

import AppShell from "./AppShell";

interface StaticPageLayoutProps {
  children: React.ReactNode;
  showBackToAgent?: boolean;
}

export default function StaticPageLayout({
  children,
  showBackToAgent = false,
}: StaticPageLayoutProps) {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-16 pt-20">
        <nav className="mb-12 flex flex-wrap items-center gap-5 text-[11px] font-mono uppercase tracking-[0.08em] text-ink-faint">
          <a href="/musings" className="hover:text-ink transition-colors">
            Musings
          </a>
          <a href="/about" className="hover:text-ink transition-colors">
            About
          </a>
          <a href="/contact" className="hover:text-ink transition-colors">
            Contact
          </a>
        </nav>

        {children}

        {showBackToAgent && (
          <nav className="mt-16 flex items-center gap-8">
            <a
              href="/?replay=1"
              className="text-sm font-mono text-accent hover:text-ink transition-colors"
            >
              back to agent
            </a>
          </nav>
        )}
      </div>
    </AppShell>
  );
}
