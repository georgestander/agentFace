# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Agent Face is an autonomous AI performer for George Stander's portfolio. An agent reads George's concepts, reasons visibly about how to present each one, then chooses from a set of presentation tools to render it on a canvas. Visitors watch the agent think and perform, then advance to the next concept.

Light, minimalist aesthetic. Not a chatbot — a performer.

## Commands

```bash
pnpm dev          # Local dev server at http://localhost:5173
pnpm build        # Production build validation
pnpm release      # Build + deploy to Cloudflare Workers
pnpm generate     # Regenerate Cloudflare Worker types
```

No automated test suite. Verify with `pnpm build` + manual smoke test in `pnpm dev`.

## Architecture

**Runtime:** Cloudflare Workers + RedwoodSDK + React 19 + TypeScript (strict)
**Styling:** Tailwind CSS via CDN (light theme, configured in `Document.tsx`)
**AI:** OpenRouter API with function calling (default model: `anthropic/claude-sonnet-4`)

### Performance Flow

```
Visitor arrives → Intro screen (typewriter text, "yes, show me" / "no" choice)
  → "yes" → Agent reads concept → Reasons visibly (SSE streamed text)
  → Visitor clicks "show me" → Tool renders on canvas → Stops
  → Visitor clicks "next" (or "← back" to revisit) → Repeat
  → All concepts done → FinScreen with about/projects/contact buttons
  → "no" → Conventional static page
```

### API Route

- `POST /api/perform` — The performer endpoint. Sends concepts + tool definitions to OpenRouter with `tool_choice: "auto"`. Streams back reasoning (content) + tool calls (function calling).

### Tool System

Tools live in `src/app/tools/`. Each tool has two halves:

1. **Definition** (`tools/definitions/*.ts`) — Zod schema for validation + OpenAI function schema sent to the model
2. **Renderer** (`tools/renderers/*.tsx`) — React component that renders the tool's output

The registry (`tools/registry.ts`) collects all tools and exports them in OpenRouter's format. The renderer index (`tools/renderers/index.ts`) maps tool names to React components.

**Available tools:** `typography_display`, `narrative_sequence`, `concept_map`, `reveal_sequence`, `marginalia`, `comparison`

### SSE Stream Parsing

`src/app/agent/parse-stream.ts` handles OpenRouter's streaming format for tool calling:
- `delta.content` → reasoning text (shown to visitor in real-time, just regular model output — no reasoning/thinking model)
- `delta.tool_calls` → tool name + arguments (accumulated as partial JSON fragments, validated after `[DONE]`)

### State Machine

`src/app/context/PerformanceContext.tsx` manages the full lifecycle:

```
intro → idle → reasoning → reasoning-done → presenting → awaiting → idle → ... → complete
                                                              ↕ (browsing history)
                                                           error (recoverable)
```

**Key phases:**
- `intro` — Initial state. IntroScreen with typewriter effect + yes/no choice.
- `reasoning` — Agent is streaming reasoning text.
- `reasoning-done` — Reasoning complete, "show me" button visible, visitor decides when to see the presentation.
- `presenting` — Tool is rendering (15s safety timeout if onReady never fires).
- `awaiting` — Presentation complete, "next" and "← back" buttons visible.
- `error` — Recoverable error with "try again" button.
- `complete` — All concepts done, FinScreen shown.

**History browsing:** Visitor can click "← back" or click past concepts in ConceptBox to revisit historical presentations without re-calling the API.

### Key Directories

- `src/app/tools/definitions/` — Tool schemas (Zod + OpenAI function defs)
- `src/app/tools/renderers/` — Tool React components
- `src/app/agent/` — Server-side: OpenRouter handler, system prompt, concepts data, stream parser
- `src/app/components/` — Stage, ConceptBox, IntroScreen, FinScreen, NavigationControls, Header, Footer, ReasoningTrace, ToolRenderer
- `src/app/pages/` — Home (performer), Conventional (static fallback), About, Projects, Contact

### Multi-Turn Conversation Format

Each turn in the performance requires proper OpenRouter tool calling format:
1. Assistant message with `content` (reasoning) + `tool_calls` array
2. Tool result message with `role: "tool"` and matching `tool_call_id`
3. Next user/system message to continue

The Stage component reconstructs this from its history when requesting the next concept.

### Concepts

`src/app/agent/concepts.ts` — Array of `Concept` objects (id, bullet, elaboration, themes). The bullet is shown in the ConceptBox UI (progressively revealed). The full concept is injected into the system prompt for the agent to reason about.

### Error Recovery

- 30s fetch timeout via AbortController
- Tool validation failure transitions to error phase (not silent)
- Missing tool call in response transitions to error phase
- 15s safety timeout on presenting phase if onReady never fires
- Error phase shows contextual message + "try again" button

## Conventions

- 2-space indent, semicolons, double quotes
- PascalCase for React component files, kebab-case for utility modules
- `@/` path alias for app-local imports
- `"use client"` directive on browser components
- Validate all model output with Zod before rendering
- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`)
- **Always make atomic commits** — one logical change per commit, never bundle unrelated changes

## Adding a New Tool

1. Create `src/app/tools/definitions/my-tool.ts` — export Zod schema + `ToolDefinition`
2. Create `src/app/tools/renderers/MyTool.tsx` — React component with `{ props: unknown; onReady?: () => void }`
3. Register in `tools/registry.ts` and `tools/renderers/index.ts`
4. The agent will see the new tool via OpenRouter's function calling and can choose to use it

## Environment

- `OPENROUTER_API_KEY` (required) — set in `.dev.vars` locally, `wrangler secret put` for prod
- `AI_MODEL` (optional) — override in `wrangler.jsonc`, defaults to `anthropic/claude-sonnet-4`

## Agent Behavior

The system prompt (`system-prompt.ts`) tells the agent to:
- Think aloud (1-3 sentences of reasoning, visible to visitor)
- Call exactly one tool per concept
- Never say "I'm an AI" — it's George's agent
- Vary tool selection across concepts
- Two audiences matter: (1) people intrigued by how this was built, (2) potential mentors — but the agent doesn't say that explicitly
