import { z } from "zod";
import type { ToolDefinition } from "../tool-types";

export const RevealSequenceSchema = z.object({
  layers: z
    .array(
      z.object({
        content: z.string(),
        kind: z.enum(["text", "label", "highlight"]).default("text"),
      })
    )
    .min(2)
    .max(6),
  title: z.string().optional(),
});

export type RevealSequenceProps = z.infer<typeof RevealSequenceSchema>;

export const revealSequenceTool: ToolDefinition = {
  name: "reveal_sequence",
  function: {
    name: "reveal_sequence",
    description:
      "Progressive reveal — layers of text that uncover one by one, like peeling back an idea. The visitor clicks to reveal each layer. Use for concepts that have depth or hidden complexity.",
    parameters: {
      type: "object",
      properties: {
        layers: {
          type: "array",
          description: "2-6 layers to reveal progressively.",
          items: {
            type: "object",
            properties: {
              content: { type: "string", description: "The text content of this layer." },
              kind: {
                type: "string",
                enum: ["text", "label", "highlight"],
                description:
                  "Visual style. 'text' is normal, 'label' is small/mono, 'highlight' has emphasis. Default: text.",
              },
            },
            required: ["content"],
          },
        },
        title: {
          type: "string",
          description: "Title shown above the layers. Optional.",
        },
      },
      required: ["layers"],
    },
  },
  schema: RevealSequenceSchema,
};
