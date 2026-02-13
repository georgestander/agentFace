import { getToolByName } from "../tools/registry";

export interface StreamedToolCall {
  id: string;
  name: string;
  argumentsJson: string;
}

export interface StreamState {
  /** Reasoning text accumulated so far */
  reasoning: string;
  /** Tool calls accumulated so far (usually 0 or 1) */
  toolCalls: StreamedToolCall[];
  /** Whether the stream is done */
  done: boolean;
}

export function createStreamState(): StreamState {
  return { reasoning: "", toolCalls: [], done: false };
}

/**
 * Processes a single SSE data line and returns updated state.
 * Handles both delta.content (reasoning text) and delta.tool_calls
 * (tool invocations with incrementally streamed arguments).
 */
export function processSSELine(
  line: string,
  current: StreamState
): StreamState {
  const trimmed = line.trim();
  if (!trimmed || !trimmed.startsWith("data: ")) return current;

  const data = trimmed.slice(6).trim();
  if (data === "[DONE]") return { ...current, done: true };

  try {
    const json = JSON.parse(data);
    const delta = json.choices?.[0]?.delta;
    if (!delta) return current;

    let reasoning = current.reasoning;
    const toolCalls = [...current.toolCalls];

    // Accumulate content (reasoning text)
    if (delta.content) {
      reasoning += delta.content;
    }

    // Accumulate tool calls
    if (delta.tool_calls) {
      for (const tc of delta.tool_calls) {
        const idx = tc.index ?? 0;
        if (!toolCalls[idx]) {
          toolCalls[idx] = {
            id: tc.id || "",
            name: tc.function?.name || "",
            argumentsJson: "",
          };
        }
        if (tc.id) toolCalls[idx].id = tc.id;
        if (tc.function?.name) toolCalls[idx].name = tc.function.name;
        if (tc.function?.arguments) {
          toolCalls[idx].argumentsJson += tc.function.arguments;
        }
      }
    }

    return { reasoning, toolCalls, done: false };
  } catch {
    return current;
  }
}

/**
 * Validate and parse a completed tool call's arguments against its Zod schema.
 */
export function validateToolCall(
  toolCall: StreamedToolCall
): { valid: true; name: string; props: Record<string, unknown> } | { valid: false; error: string } {
  const tool = getToolByName(toolCall.name);
  if (!tool) {
    return { valid: false, error: `Unknown tool: ${toolCall.name}` };
  }

  try {
    const rawArgs = JSON.parse(toolCall.argumentsJson);
    const validated = tool.schema.parse(rawArgs);
    return { valid: true, name: toolCall.name, props: validated as Record<string, unknown> };
  } catch (err) {
    return { valid: false, error: String(err) };
  }
}
