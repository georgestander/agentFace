"use client";

import StaticPageLayout from "../components/StaticPageLayout";
import StreamedCopy from "../components/StreamedCopy";
import { getMusingBySlug } from "../content/musings";

interface MusingEntryProps {
  slug: string;
}

export default function MusingEntry({ slug }: MusingEntryProps) {
  const entry = getMusingBySlug(slug);

  if (!entry) {
    return (
      <StaticPageLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-medium text-ink">Not Found</h1>
          <p className="text-sm text-ink-muted leading-relaxed">
            That musing does not exist yet.
          </p>
          <a
            href="/musings"
            className="inline-flex text-xs font-mono uppercase tracking-[0.08em] text-ink hover:text-accent transition-colors"
          >
            ← back to musings
          </a>
        </div>
      </StaticPageLayout>
    );
  }

  return (
    <StaticPageLayout>
      <article className="space-y-8">
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.08em] text-ink-faint">
            <span>{entry.type}</span>
            <span aria-hidden>•</span>
            <span>{entry.date}</span>
          </div>
          <h1 className="text-2xl font-medium text-ink">{entry.title}</h1>
          <p className="text-sm text-ink-muted leading-relaxed">
            {entry.summary}
          </p>
        </header>

        <StreamedCopy blocks={entry.blocks} />

        <a
          href="/musings"
          className="inline-flex text-xs font-mono uppercase tracking-[0.08em] text-ink hover:text-accent transition-colors"
        >
          ← back to musings
        </a>
      </article>
    </StaticPageLayout>
  );
}

