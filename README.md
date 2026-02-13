# Agent Face — Phase 1

An AI agent that represents George through conversation and dynamically renders UI components.

## Setup

```bash
cd agent-face
pnpm install    # or npm install

# Add your OpenRouter API key to .dev.vars
# (already created — just replace the placeholder)
echo "OPENROUTER_API_KEY=sk-or-..." > .dev.vars

# Start dev server
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173)

## How it works

1. Visitor lands on a chat interface with starter prompts
2. Messages POST to `/api/chat` → forwarded to OpenRouter with streaming
3. Agent responds with mixed text and `json:ui` fenced blocks
4. Client parses the stream, renders text as chat bubbles and UI blocks as React components
5. Choice buttons send their value as new user messages

## Environment

- `OPENROUTER_API_KEY` — required. For local dev, set in `.dev.vars`. For production, use `npx wrangler secret put OPENROUTER_API_KEY`.
- `AI_MODEL` — optional, defaults to `anthropic/claude-sonnet-4` (set in wrangler.jsonc)

## Stack

- **RedwoodSDK** — React on Cloudflare Workers (SSR + RSC)
- **OpenRouter** — model-agnostic AI API
- **Zod** — runtime validation of agent UI output
- **Tailwind CSS** — styling (CDN for Phase 1)

## Deploy

```bash
pnpm run release
```
