import { z } from "zod";
import type { ToolDefinition } from "../tool-types";

export const ComparisonSchema = z.object({
  left: z.object({
    heading: z.string(),
    points: z.array(z.string()).min(1).max(5),
    tone: z.enum(["conventional", "neutral"]).default("neutral"),
  }),
  right: z.object({
    heading: z.string(),
    points: z.array(z.string()).min(1).max(5),
    tone: z.enum(["alternative", "preferred"]).default("alternative"),
  }),
  verdict: z.string().optional(),
});

export type ComparisonProps = z.infer<typeof ComparisonSchema>;

export const comparisonTool: ToolDefinition = {
  name: "comparison",
  function: {
    name: "comparison",
    description:
      "Side-by-side contrast of two approaches, ideas, or perspectives. Use when a concept is best understood by showing what it's not, or by contrasting the conventional with the alternative.",
    parameters: {
      type: "object",
      properties: {
        left: {
          type: "object",
          description: "The first side (often the conventional or default approach).",
          properties: {
            heading: { type: "string", description: "Column heading." },
            points: {
              type: "array",
              items: { type: "string" },
              description: "1-5 bullet points for this side.",
            },
            tone: {
              type: "string",
              enum: ["conventional", "neutral"],
              description: "Visual tone. 'conventional' is muted. Default: neutral.",
            },
          },
          required: ["heading", "points"],
        },
        right: {
          type: "object",
          description: "The second side (often the alternative or preferred approach).",
          properties: {
            heading: { type: "string", description: "Column heading." },
            points: {
              type: "array",
              items: { type: "string" },
              description: "1-5 bullet points for this side.",
            },
            tone: {
              type: "string",
              enum: ["alternative", "preferred"],
              description: "Visual tone. 'preferred' has more visual weight. Default: alternative.",
            },
          },
          required: ["heading", "points"],
        },
        verdict: {
          type: "string",
          description: "Your take on the comparison — a concluding thought. Optional.",
        },
      },
      required: ["left", "right"],
    },
  },
  schema: ComparisonSchema,
};
