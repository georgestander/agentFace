import { z } from "zod";
import type { ToolDefinition } from "../tool-types";

export const MarginaliaSchema = z.object({
  mainText: z.string(),
  annotations: z
    .array(
      z.object({
        anchor: z.string(),
        note: z.string(),
        tone: z.enum(["curious", "emphatic", "aside"]).default("aside"),
      })
    )
    .min(1)
    .max(5),
});

export type MarginaliaProps = z.infer<typeof MarginaliaSchema>;

export const marginaliaTool: ToolDefinition = {
  name: "marginalia",
  function: {
    name: "marginalia",
    description:
      "Present an idea with marginal annotations — the main text with your commentary in the margins, like a well-annotated book. Use when you want to add your own perspective or context to a concept.",
    parameters: {
      type: "object",
      properties: {
        mainText: {
          type: "string",
          description:
            "The primary text that tells the concept. Will be rendered in the center column.",
        },
        annotations: {
          type: "array",
          description: "1-5 marginal notes attached to words in the main text.",
          items: {
            type: "object",
            properties: {
              anchor: {
                type: "string",
                description:
                  "A word or short phrase from mainText that this note attaches to.",
              },
              note: {
                type: "string",
                description: "Your marginal commentary.",
              },
              tone: {
                type: "string",
                enum: ["curious", "emphatic", "aside"],
                description: "Tone of the note. Default: aside.",
              },
            },
            required: ["anchor", "note"],
          },
        },
      },
      required: ["mainText", "annotations"],
    },
  },
  schema: MarginaliaSchema,
};
