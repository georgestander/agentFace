"use client";

import AppShell from "../components/AppShell";

export default function Musings() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-16 pt-20">
        <h1 className="text-2xl font-medium text-ink mb-8">Musings</h1>

        <div className="space-y-8">
          <div className="border-l-2 border-stone-200 pl-4">
            <h2 className="text-sm font-medium text-ink">WorkspaceOS</h2>
            <p className="mt-1 text-sm text-ink-muted leading-relaxed">
              Agents should have desks, not toolbars. A workspace-first approach
              to AI-assisted work.
            </p>
          </div>

          <div className="border-l-2 border-stone-200 pl-4">
            <h2 className="text-sm font-medium text-ink">Connexus</h2>
            <p className="mt-1 text-sm text-ink-muted leading-relaxed">
              Thought is not linear — why is chat? A non-linear interface for
              exploring ideas.
            </p>
          </div>

          <div className="border-l-2 border-stone-200 pl-4">
            <h2 className="text-sm font-medium text-ink">Agent Face</h2>
            <p className="mt-1 text-sm text-ink-muted leading-relaxed">
              This site. An autonomous AI performer that presents concepts using
              a set of visual tools. The portfolio piece is the portfolio itself.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
