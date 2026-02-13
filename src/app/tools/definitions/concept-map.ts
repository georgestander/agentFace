import { z } from "zod";
import type { ToolDefinition } from "../tool-types";

export const ConceptMapSchema = z.object({
  nodes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        description: z.string().optional(),
      })
    )
    .min(2)
    .max(7),
  edges: z
    .array(
      z.object({
        from: z.string(),
        to: z.string(),
        label: z.string().optional(),
      })
    )
    .min(1),
  centerNode: z.string().optional(),
});

export type ConceptMapProps = z.infer<typeof ConceptMapSchema>;

export const conceptMapTool: ToolDefinition = {
  name: "concept_map",
  function: {
    name: "concept_map",
    description:
      "Show relationships between ideas as a minimal node-and-line diagram. Use when a concept involves connections, dependencies, or a web of related thoughts. Nodes are ideas, edges are relationships.",
    parameters: {
      type: "object",
      properties: {
        nodes: {
          type: "array",
          description: "2-7 idea nodes.",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "Unique identifier for this node." },
              label: { type: "string", description: "Short label (1-4 words)." },
              description: {
                type: "string",
                description: "Longer description shown on hover. Optional.",
              },
            },
            required: ["id", "label"],
          },
        },
        edges: {
          type: "array",
          description: "Connections between nodes.",
          items: {
            type: "object",
            properties: {
              from: { type: "string", description: "Source node id." },
              to: { type: "string", description: "Target node id." },
              label: {
                type: "string",
                description: "Relationship label shown on the edge. Optional.",
              },
            },
            required: ["from", "to"],
          },
        },
        centerNode: {
          type: "string",
          description: "ID of the node to emphasize at the center. Optional.",
        },
      },
      required: ["nodes", "edges"],
    },
  },
  schema: ConceptMapSchema,
};
