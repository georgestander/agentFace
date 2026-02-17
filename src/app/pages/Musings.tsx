"use client";

import StaticPageLayout from "../components/StaticPageLayout";
import { MUSINGS } from "../content/musings";

export default function Musings() {
  return (
    <StaticPageLayout>
      <div className="space-y-8">
        <header className="space-y-3">
          <h1 className="text-2xl font-medium text-ink">Musings</h1>
          <p className="text-sm text-ink-muted leading-relaxed max-w-xl">
            Projects and essays that sit behind the concepts. Same worldview,
            longer form.
          </p>
        </header>

        <ul className="space-y-4">
          {MUSINGS.map((entry) => (
            <li
              key={entry.slug}
              className="rounded-xl border border-stone-200 bg-surface/90 p-5 backdrop-blur-sm"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.08em] text-ink-faint">
                <span>{entry.type}</span>
                <span aria-hidden>•</span>
                <span>{entry.date}</span>
              </div>

              <h2 className="text-lg font-medium text-ink">{entry.title}</h2>
              <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                {entry.summary}
              </p>

              <a
                href={`/musings/${entry.slug}`}
                className="mt-4 inline-flex text-xs font-mono uppercase tracking-[0.08em] text-ink hover:text-accent transition-colors"
              >
                read more →
              </a>
            </li>
          ))}
        </ul>
      </div>
    </StaticPageLayout>
  );
}
