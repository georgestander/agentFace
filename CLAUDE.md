# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Agent Face is a conversational AI portfolio for George Stander. It's a React app on Cloudflare Workers (via RedwoodSDK) that uses OpenRouter to power an agent that talks to visitors and dynamically renders UI components (`json:ui` blocks) to showcase George's work and find him a mentor.

## Commands

```bash
pnpm dev          # Local dev server at http://localhost:5173
pnpm build        # Production build validation
pnpm release      # Build + deploy to Cloudflare Workers
pnpm generate     # Regenerate Cloudflare Worker types
```

No automated test suite exists. Verify changes with `pnpm build` + manual smoke test (`pnpm dev` → send message → confirm streaming + UI blocks render).

## Architecture

**Runtime:** Cloudflare Workers + RedwoodSDK + React 19 + TypeScript (strict)
**Styling:** Tailwind CSS via CDN (configured inline in `Document.tsx`)
**AI:** OpenRouter API (default model: `anthropic/claude-sonnet-4`)

### Request Flow

1. `src/worker.tsx` — Routes: `/` renders Home, `POST /api/chat` hits `chatHandler`
2. `src/app/agent/openrouter.ts` — Prepends system prompt, forwards to OpenRouter with `stream: true`, pipes SSE back
3. `src/app/components/Chat.tsx` — Reads SSE stream, accumulates text, on stream end calls `parseResponse()`
4. `src/app/agent/parse-response.ts` — Splits response into text segments and `json:ui` fenced blocks, validates JSON against Zod schemas
5. `src/app/components/ChatBubble.tsx` → `UIBlock.tsx` — Renders segments, routing UI blocks to catalog components

### Key Directories

- `src/app/agent/` — Server-side: OpenRouter proxy, system prompt builder, response parser, project knowledge base
- `src/app/catalog/` — Zod schemas (`catalog.ts`) defining all UI block types + their React component implementations
- `src/app/components/` — Chat UI: message display, streaming state, UI block router
- `src/app/context/` — React Context for choice button callbacks

### The json:ui System

The agent outputs mixed text and fenced JSON blocks like:

```
Some text here

\```json:ui
{ "type": "ProjectCard", "props": { "title": "...", ... } }
\```
```

`parseResponse()` splits these into `Segment[]` (text | ui). UI segments are Zod-validated against `UIBlockSchema` (discriminated union on `type`). Failed validation falls back to rendering as text.

**Current UI block types:** `Prose`, `ChoiceButtons`, `ProjectCard`, `ProjectGrid` (contains ProjectCard children)

### Message History

`Chat.tsx` reconstructs raw message format when sending to the API — text segments become plain text, UI segments get re-wrapped in `json:ui` fences. This preserves full conversation context across turns.

## Conventions

- 2-space indent, semicolons, double quotes
- PascalCase for React component files, kebab-case for utility modules
- `@/` path alias for app-local imports
- `"use client"` directive on browser components
- Validate all model output with Zod before rendering
- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`)

## Environment

- `OPENROUTER_API_KEY` (required) — set in `.dev.vars` locally, `wrangler secret put` for prod
- `AI_MODEL` (optional) — override in `wrangler.jsonc`, defaults to `anthropic/claude-sonnet-4`

## Agent Personality Notes

The system prompt (`system-prompt.ts`) defines the agent as George's representative — warm, direct, curious. It should never say "I'm an AI." It uses ChoiceButtons instead of prose questions, renders ProjectCards for projects, and keeps responses concise. The goal is helping visitors understand George and connecting him with a mentor.
