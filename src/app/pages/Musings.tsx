"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StaticPageLayout from "../components/StaticPageLayout";
import { MUSINGS } from "../content/musings";

const PAGE_SIZE = 3;

function parsePage(value: string | null): number {
  if (!value) return 1;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default function Musings() {
  const totalPages = Math.max(1, Math.ceil(MUSINGS.length / PAGE_SIZE));
  const [page, setPage] = useState(1);

  const clampPage = useCallback(
    (value: number) => Math.min(Math.max(1, value), totalPages),
    [totalPages]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPage(clampPage(parsePage(params.get("page"))));
  }, [clampPage]);

  useEffect(() => {
    const onPopState = () => {
      const params = new URLSearchParams(window.location.search);
      setPage(clampPage(parsePage(params.get("page"))));
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [clampPage]);

  const pageEntries = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return MUSINGS.slice(start, start + PAGE_SIZE);
  }, [page]);

  const goToNextPage = () => {
    const nextPage = clampPage(page + 1);
    if (nextPage === page) return;

    setPage(nextPage);
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(nextPage));
    window.history.pushState({}, "", `${url.pathname}${url.search}`);
  };

  const goToPreviousPage = () => {
    const previousPage = clampPage(page - 1);
    if (previousPage === page) return;

    setPage(previousPage);
    const url = new URL(window.location.href);
    url.searchParams.set("page", String(previousPage));
    window.history.pushState({}, "", `${url.pathname}${url.search}`);
  };

  const hasPreviousPage = page > 1;
  const hasNextPage = page < totalPages;

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
          {pageEntries.map((entry) => (
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

        <div className="flex flex-col gap-3 border-t border-stone-200/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-ink-faint">
            page {page} of {totalPages}
          </p>

          {totalPages > 1 ? (
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                onClick={goToPreviousPage}
                disabled={!hasPreviousPage}
                className="w-full sm:w-auto rounded-md border border-stone-300 bg-surface-raised px-4 py-2 text-xs font-mono uppercase tracking-[0.08em] text-ink transition-colors cursor-pointer enabled:hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← previous
              </button>

              <button
                onClick={goToNextPage}
                disabled={!hasNextPage}
                className="w-full sm:w-auto rounded-md border border-stone-300 bg-surface-raised px-4 py-2 text-xs font-mono uppercase tracking-[0.08em] text-ink transition-colors cursor-pointer enabled:hover:border-ink-faint disabled:cursor-not-allowed disabled:opacity-40"
              >
                next musings →
              </button>
            </div>
          ) : (
            <p className="text-[10px] font-mono uppercase tracking-[0.08em] text-ink-faint">
              you&apos;re caught up
            </p>
          )}
        </div>
      </div>
    </StaticPageLayout>
  );
}
