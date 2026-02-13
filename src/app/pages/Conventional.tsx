"use client";

import { CONCEPTS } from "../agent/concepts";
import AppShell from "../components/AppShell";

export default function Conventional() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-16 pt-20">
        {/* Header */}
        <header className="mb-16">
          <h1 className="text-2xl font-medium text-ink">George Stander</h1>
          <p className="mt-2 text-sm text-ink-muted font-mono">
            builder, thinker, maker of things with purpose
          </p>
        </header>

        {/* Concepts */}
        <section className="mb-16">
          <h2 className="text-xs font-mono text-ink-faint uppercase tracking-wider mb-6">
            How I Think
          </h2>
          <ul className="space-y-6">
            {CONCEPTS.map((concept) => (
              <li key={concept.id} className="border-l-2 border-stone-200 pl-4">
                <p className="text-sm font-medium text-ink">{concept.bullet}</p>
                <p className="mt-1 text-sm text-ink-muted leading-relaxed">
                  {concept.elaboration}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Links */}
        <nav className="flex items-center gap-8">
          <a
            href="/"
            className="text-sm font-mono text-accent hover:text-ink transition-colors"
          >
            back to agent
          </a>
        </nav>
      </div>
    </AppShell>
  );
}
