"use client";

import { Component, Suspense, type ReactNode } from "react";
import { TOOL_RENDERERS } from "../tools/renderers";

interface ToolRendererProps {
  name: string;
  props: Record<string, unknown>;
  onReady?: () => void;
  onInteractionLockChange?: (locked: boolean) => void;
}

/** Error boundary that catches render failures from tool components. */
class ToolErrorBoundary extends Component<
  { name: string; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[ToolRenderer] ${this.props.name} crashed:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full text-ink-muted text-sm font-mono">
          presentation failed to render
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ToolRenderer({
  name,
  props,
  onReady,
  onInteractionLockChange,
}: ToolRendererProps) {
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
    <ToolErrorBoundary name={name}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full text-ink-faint text-xs font-mono animate-pulse">
            loading...
          </div>
        }
      >
        <Component
          props={props}
          onReady={onReady}
          onInteractionLockChange={onInteractionLockChange}
        />
      </Suspense>
    </ToolErrorBoundary>
  );
}
