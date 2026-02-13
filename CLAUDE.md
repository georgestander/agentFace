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
Page loads → Agent reads concept → Reasons visibly (SSE streamed text)
  → Calls a presentation tool → Tool renders on canvas → Stops
  → Visitor hits "next" → Agent picks next concept + tool → Repeat
```

### Two API Routes

- `POST /api/perform` — The performer endpoint. Sends concepts + tool definitions to OpenRouter with `tool_choice: "required"`. Streams back reasoning (content) + tool calls (function calling).
- `POST /api/chat` — Legacy chatbot endpoint (kept for backward compat during migration).

### Tool System

Tools live in `src/app/tools/`. Each tool has two halves:

1. **Definition** (`tools/definitions/*.ts`) — Zod schema for validation + OpenAI function schema sent to the model
2. **Renderer** (`tools/renderers/*.tsx`) — React component that renders the tool's output

The registry (`tools/registry.ts`) collects all tools and exports them in OpenRouter's format. The renderer index (`tools/renderers/index.ts`) maps tool names to React components.

**Available tools:** `typography_display`, `narrative_sequence`, `concept_map`, `reveal_sequence`, `marginalia`, `comparison`

### SSE Stream Parsing

`src/app/agent/parse-stream.ts` handles OpenRouter's streaming format for tool calling:
- `delta.content` → reasoning text (shown to visitor in real-time)
- `delta.tool_calls` → tool name + arguments (accumulated as partial JSON fragments, validated after `[DONE]`)

This replaces the old `parse-response.ts` regex-based approach.

### State Machine

`src/app/context/PerformanceContext.tsx` manages: `idle → reasoning → presenting → awaiting → idle → ...`

### Key Directories

- `src/app/tools/definitions/` — Tool schemas (Zod + OpenAI function defs)
- `src/app/tools/renderers/` — Tool React components
- `src/app/agent/` — Server-side: OpenRouter handler, system prompt, concepts data, stream parser
- `src/app/components/` — Stage (main canvas), ConceptBox (top-right), ReasoningTrace, ToolRenderer

### Multi-Turn Conversation Format

Each turn in the performance requires proper OpenRouter tool calling format:
1. Assistant message with `content` (reasoning) + `tool_calls` array
2. Tool result message with `role: "tool"` and matching `tool_call_id`
3. Next user/system message to continue

The Stage component reconstructs this from its history when requesting the next concept.

### Concepts

`src/app/agent/concepts.ts` — Array of `Concept` objects (id, bullet, elaboration, themes). The bullet is shown in the ConceptBox UI. The full concept is injected into the system prompt for the agent to reason about.

## Conventions

- 2-space indent, semicolons, double quotes
- PascalCase for React component files, kebab-case for utility modules
- `@/` path alias for app-local imports
- `"use client"` directive on browser components
- Validate all model output with Zod before rendering
- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`)

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
