/**
 * Component Protocol — Tambo-inspired tool rendering contract.
 *
 * Defines the interface between the runtime and tool renderers:
 * - Each renderer receives its props + IntentSpec + UiMood
 * - Renderers signal readiness via onReady callback
 * - Renderers expose a primary interaction path and a fallback path
 *
 * This module is importable on both server and client since it only
 * defines types and constants (no React hooks or DOM access).
 */

import type { IntentSpec, UiMood, StepPacket } from "./types";

// ---------------------------------------------------------------------------
// Renderer props contract
// ---------------------------------------------------------------------------

/**
 * Props that every tool renderer receives from the v3 runtime.
 * Extends the legacy `{ props, onReady }` contract with intent and mood.
 */
export interface V3RendererProps {
  /** The tool-specific props (validated via Zod) */
  props: Record<string, unknown>;
  /** The deterministic (or model-provided) intent for this step */
  intentSpec: IntentSpec;
  /** The deterministic (or model-provided) mood for this step */
  uiMood: UiMood;
  /** Signal that the presentation is ready for viewing */
  onReady?: () => void;
}

// ---------------------------------------------------------------------------
// Component registration
// ---------------------------------------------------------------------------

/**
 * A registered v3 component pairs a tool name with metadata about
 * how the runtime should treat it.
 */
export interface ComponentRegistration {
  /** Must match the tool definition name */
  toolName: string;
  /** Whether this tool supports the v3 intent/mood contract.
   *  Legacy tools that only accept `{ props, onReady }` set this to false. */
  v3Aware: boolean;
}

const _registry = new Map<string, ComponentRegistration>();

export function registerComponent(reg: ComponentRegistration): void {
  _registry.set(reg.toolName, reg);
}

export function getComponentRegistration(
  toolName: string
): ComponentRegistration | undefined {
  return _registry.get(toolName);
}

export function isV3Aware(toolName: string): boolean {
  return _registry.get(toolName)?.v3Aware ?? false;
}

// ---------------------------------------------------------------------------
// Packet → renderer props adapter
// ---------------------------------------------------------------------------

/**
 * Build renderer props from a StepPacket.
 * For legacy renderers, only `props` and `onReady` are used.
 * For v3-aware renderers, `intentSpec` and `uiMood` are also provided.
 */
export function packetToRendererProps(
  packet: StepPacket,
  onReady?: () => void
): V3RendererProps {
  return {
    props: packet.toolProps,
    intentSpec: packet.intentSpec,
    uiMood: packet.uiMood,
    onReady,
  };
}
