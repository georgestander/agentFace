import { z } from "zod";

// --- Individual component schemas ---

export const ProseSchema = z.object({
  type: z.literal("Prose"),
  props: z.object({
    content: z.string(),
    tone: z.enum(["warm", "direct", "reflective"]).optional(),
  }),
});

export const ChoiceButtonsSchema = z.object({
  type: z.literal("ChoiceButtons"),
  props: z.object({
    prompt: z.string().optional(),
    choices: z
      .array(
        z.object({
          label: z.string(),
          value: z.string(),
          variant: z.enum(["primary", "secondary", "ghost"]).optional(),
        })
      )
      .min(2)
      .max(4),
  }),
});

export const ProjectCardSchema = z.object({
  type: z.literal("ProjectCard"),
  props: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    status: z.enum(["live", "building", "concept", "shipped"]).optional(),
    url: z.string().optional(),
  }),
});

export const ProjectGridSchema = z.object({
  type: z.literal("ProjectGrid"),
  props: z.object({
    columns: z.number().min(1).max(3).optional(),
  }),
  children: z.array(ProjectCardSchema).optional(),
});

// --- Discriminated union for all UI blocks ---

export const UIBlockSchema = z.discriminatedUnion("type", [
  ProseSchema,
  ChoiceButtonsSchema,
  ProjectCardSchema,
  ProjectGridSchema,
]);

export type UIBlock = z.infer<typeof UIBlockSchema>;
export type ProseBlock = z.infer<typeof ProseSchema>;
export type ChoiceButtonsBlock = z.infer<typeof ChoiceButtonsSchema>;
export type ProjectCardBlock = z.infer<typeof ProjectCardSchema>;
export type ProjectGridBlock = z.infer<typeof ProjectGridSchema>;

// --- Catalog prompt for the AI agent ---

export function generateCatalogPrompt(): string {
  return `## How you communicate

You communicate through a mix of conversational text and rendered UI components.

When you want to show something visual — a project, a set of choices, a key fact —
you render it as a UI component instead of describing it in text.

To render a component, output a fenced JSON block with the \`json:ui\` language tag:

\`\`\`json:ui
{
  "type": "ComponentName",
  "props": { ... }
}
\`\`\`

Available components:

### Prose
A block of formatted text. Use for longer explanations or storytelling.
Props:
- content (string, required) — the text content
- tone ("warm" | "direct" | "reflective", optional) — affects visual styling

### ChoiceButtons
Present the viewer with 2-4 choices. Use INSTEAD of asking questions in prose. Always.
Props:
- prompt (string, optional) — label above the buttons
- choices (array, required, 2-4 items) — each with:
  - label (string) — button text
  - value (string) — what gets sent when clicked
  - variant ("primary" | "secondary" | "ghost", optional)

### ProjectCard
Showcase one of George's projects with title, description, tags, and optional link.
Props:
- title (string, required)
- description (string, required)
- tags (string[], optional)
- status ("live" | "building" | "concept" | "shipped", optional)
- url (string, optional)

### ProjectGrid
Display multiple projects in a grid layout. Contains ProjectCard children.
Props:
- columns (number 1-3, optional, default 2)
- children (array of ProjectCard objects)

Example of a ProjectGrid:
\`\`\`json:ui
{
  "type": "ProjectGrid",
  "props": { "columns": 2 },
  "children": [
    {
      "type": "ProjectCard",
      "props": {
        "title": "WorkspaceOS",
        "description": "An agent-native workspace.",
        "tags": ["AI", "RedwoodSDK"],
        "status": "building"
      }
    },
    {
      "type": "ProjectCard",
      "props": {
        "title": "Connexus",
        "description": "Non-linear chat.",
        "tags": ["AI", "UX"],
        "status": "building"
      }
    }
  ]
}
\`\`\`

### Rules for rendering:
- Use ChoiceButtons instead of asking questions in prose. Always.
- When discussing projects, render ProjectCards. Don't describe them in a paragraph.
- One component per json:ui block.
- You can mix text and components freely in a single response.
- Don't over-render. A response can be just text if that's what the moment calls for.
- When the viewer selects a choice button, you receive their selection as a user message with the value they chose.`;
}
