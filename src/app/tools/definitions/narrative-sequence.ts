import { z } from "zod";
import type { ToolDefinition } from "../tool-types";

export const NarrativeSequenceSchema = z.object({
  beats: z
    .array(
      z.object({
        text: z.string(),
        pause: z.number().optional(),
        emphasis: z.enum(["normal", "strong", "whisper"]).default("normal"),
      })
    )
    .min(2)
    .max(8),
  conclusion: z.string().optional(),
});

export type NarrativeSequenceProps = z.infer<typeof NarrativeSequenceSchema>;

export const narrativeSequenceTool: ToolDefinition = {
  name: "narrative_sequence",
  function: {
    name: "narrative_sequence",
    description:
      "Tell a concept as a timed narrative — a sequence of short text beats that build a story, one after another. Each beat appears, the previous fades. Use for ideas that unfold or have a progression.",
    parameters: {
      type: "object",
      properties: {
        beats: {
          type: "array",
          description: "2-8 short text fragments that build the narrative, shown one at a time.",
          items: {
            type: "object",
            properties: {
              text: { type: "string", description: "The text of this beat." },
              pause: {
                type: "number",
                description: "Milliseconds to hold this beat before the next. Default: 2500.",
              },
              emphasis: {
                type: "string",
                enum: ["normal", "strong", "whisper"],
                description: "Visual weight of this beat. Default: normal.",
              },
            },
            required: ["text"],
          },
        },
        conclusion: {
          type: "string",
          description: "A final line that stays visible after all beats. Optional.",
        },
      },
      required: ["beats"],
    },
  },
  schema: NarrativeSequenceSchema,
};
