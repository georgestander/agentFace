import type { ToolDefinition } from "./tool-types";
import { typographyDisplayTool } from "./definitions/typography-display";
import { narrativeSequenceTool } from "./definitions/narrative-sequence";
import { conceptMapTool } from "./definitions/concept-map";
import { revealSequenceTool } from "./definitions/reveal-sequence";
import { marginaliaTool } from "./definitions/marginalia";
import { comparisonTool } from "./definitions/comparison";

/** All registered tools */
export const TOOL_REGISTRY: ToolDefinition[] = [
  typographyDisplayTool,
  narrativeSequenceTool,
  conceptMapTool,
  revealSequenceTool,
  marginaliaTool,
  comparisonTool,
];

/** Get tool definitions in the format OpenRouter expects */
export function getOpenRouterTools(): Array<{
  type: "function";
  function: { name: string; description: string; parameters: Record<string, unknown> };
}> {
  return TOOL_REGISTRY.map((t) => ({
    type: "function" as const,
    function: t.function,
  }));
}

/** Look up a tool by name */
export function getToolByName(name: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((t) => t.name === name);
}
