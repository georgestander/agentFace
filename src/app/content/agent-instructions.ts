import instructionsMarkdown from "../../../content/agent-instructions.md?raw";

/**
 * Additional system guidance loaded from editable markdown.
 *
 * Maintainers can steer behavior without touching TypeScript.
 */
export const AGENT_INSTRUCTIONS = instructionsMarkdown.trim();

