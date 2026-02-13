"use client";

import { Suspense } from "react";
import { TOOL_RENDERERS } from "../tools/renderers";

interface ToolRendererProps {
  name: string;
  props: Record<string, unknown>;
  onReady?: () => void;
}

export default function ToolRenderer({ name, props, onReady }: ToolRendererProps) {
  const Component = TOOL_RENDERERS[name];

  if (!Component) {
    console.warn(`[ToolRenderer] Unknown tool: ${name}`);
    return (
      <div className="flex items-center justify-center h-full text-ink-muted text-sm font-mono">
        Unknown presentation: {name}
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-full text-ink-faint text-xs font-mono animate-pulse">
          loading...
        </div>
      }
    >
      <Component props={props} onReady={onReady} />
    </Suspense>
  );
}
