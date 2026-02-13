import { UIBlockSchema, type UIBlock } from "../catalog/catalog";

// --- Segment types ---

export interface TextSegment {
  type: "text";
  content: string;
}

export interface UISegment {
  type: "ui";
  component: UIBlock;
}

export type Segment = TextSegment | UISegment;

// --- Parser ---

/**
 * Parses an agent response into an ordered list of text and UI segments.
 *
 * The agent outputs mixed text and fenced JSON blocks:
 *
 *   Hey, here are some projects:
 *
 *   ```json:ui
 *   { "type": "ProjectCard", "props": { ... } }
 *   ```
 *
 *   What do you think?
 *
 * This function splits on those fences, validates the JSON against the
 * catalog schema, and returns an ordered segment array.
 */
export function parseResponse(raw: string): Segment[] {
  const segments: Segment[] = [];

  // Match ```json:ui ... ``` blocks (with flexible whitespace)
  const fenceRegex = /```json:ui\s*\n([\s\S]*?)```/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(raw)) !== null) {
    // Text before this fence
    const textBefore = raw.slice(lastIndex, match.index).trim();
    if (textBefore) {
      segments.push({ type: "text", content: textBefore });
    }

    // Parse the JSON inside the fence
    const jsonStr = match[1].trim();
    try {
      const parsed = JSON.parse(jsonStr);
      const validated = UIBlockSchema.parse(parsed);
      segments.push({ type: "ui", component: validated });
    } catch (err) {
      // Invalid JSON or failed schema validation — render as text
      console.warn("[parse-response] Failed to parse UI block:", err);
      segments.push({
        type: "text",
        content: jsonStr,
      });
    }

    lastIndex = match.index + match[0].length;
  }

  // Text after the last fence (or the entire string if no fences)
  const textAfter = raw.slice(lastIndex).trim();
  if (textAfter) {
    segments.push({ type: "text", content: textAfter });
  }

  // Edge case: empty response
  if (segments.length === 0) {
    segments.push({ type: "text", content: "..." });
  }

  return segments;
}
