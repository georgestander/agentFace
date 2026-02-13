import { z } from "zod";

/** JSON Schema object shape for OpenAI-compatible function parameters */
export type JSONSchema = Record<string, unknown>;

/** The OpenAI-compatible function definition sent to the model */
export interface ToolFunctionDef {
  name: string;
  description: string;
  parameters: JSONSchema;
}

/** A tool combines its API definition with a Zod schema for validation */
export interface ToolDefinition {
  /** Name must match the function name sent to OpenRouter */
  name: string;
  /** Sent to OpenRouter as the function definition */
  function: ToolFunctionDef;
  /** Zod schema to validate the arguments the model returns */
  schema: z.ZodType<unknown>;
}
