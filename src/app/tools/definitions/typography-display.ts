import { z } from "zod";
import type { ToolDefinition } from "../tool-types";

export const TypographyDisplaySchema = z.object({
  headline: z.string(),
  subtext: z.string().optional(),
  annotation: z.string().optional(),
  style: z.enum(["serif", "mono", "handwritten"]).default("serif"),
});

export type TypographyDisplayProps = z.infer<typeof TypographyDisplaySchema>;

export const typographyDisplayTool: ToolDefinition = {
  name: "typography_display",
  function: {
    name: "typography_display",
    description:
      "Display a concept as large-scale typography on the canvas. Use for bold, single-idea statements that deserve visual weight. The headline dominates the viewport. Subtext is a quieter line beneath. Annotation is a marginal aside from you.",
    parameters: {
      type: "object",
      properties: {
        headline: {
          type: "string",
          description:
            "The main text — a single sentence or fragment that captures the concept. This will be very large.",
        },
        subtext: {
          type: "string",
          description: "A quieter line of text beneath the headline. Optional.",
        },
        annotation: {
          type: "string",
          description:
            "A marginal note — your aside about this concept. Appears small, in the corner. Optional.",
        },
        style: {
          type: "string",
          enum: ["serif", "mono", "handwritten"],
          description: "Typographic style for the headline. Default: serif.",
        },
      },
      required: ["headline"],
    },
  },
  schema: TypographyDisplaySchema,
};
