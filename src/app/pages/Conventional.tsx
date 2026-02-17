"use client";

import { CONCEPTS } from "../agent/concepts";
import StaticPageLayout from "../components/StaticPageLayout";

export default function Conventional() {
  return (
    <StaticPageLayout showBackToAgent>
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
    </StaticPageLayout>
  );
}
