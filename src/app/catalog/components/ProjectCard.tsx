"use client";

import type { ProjectCardBlock } from "../catalog";

const statusColors: Record<string, { dot: string; text: string }> = {
  live: { dot: "bg-emerald-400", text: "text-emerald-400" },
  building: { dot: "bg-amber-400", text: "text-amber-400" },
  concept: { dot: "bg-blue-400", text: "text-blue-400" },
  shipped: { dot: "bg-zinc-400", text: "text-zinc-400" },
};

export default function ProjectCard({
  props,
}: {
  props: ProjectCardBlock["props"];
}) {
  const status = props.status ? statusColors[props.status] : null;

  const content = (
    <div className="group bg-surface-raised border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="font-semibold text-zinc-100 text-base leading-tight">
          {props.title}
        </h3>
        {status && (
          <span
            className={`flex items-center gap-1.5 text-xs font-medium ${status.text} shrink-0`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {props.status}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-zinc-400 leading-relaxed mb-4">
        {props.description}
      </p>

      {/* Tags */}
      {props.tags && props.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {props.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-md bg-zinc-800 text-zinc-400 border border-zinc-700/50"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Link indicator */}
      {props.url && (
        <div className="mt-3 pt-3 border-t border-zinc-800">
          <span className="text-xs text-accent group-hover:underline">
            View project →
          </span>
        </div>
      )}
    </div>
  );

  if (props.url) {
    return (
      <a
        href={props.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block no-underline"
      >
        {content}
      </a>
    );
  }

  return content;
}
