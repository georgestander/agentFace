# Agent Face

An AI-driven portfolio/site starter where an agent presents ideas one step at a time.

Instead of a static homepage, the site runs a guided session:
- the agent reasons briefly,
- chooses one visual tool,
- presents a concept,
- then advances through a concept sequence.

This repo is designed to be reusable. Personalization lives in content files, not hardcoded identity copy.

## Quick start

```bash
pnpm install
cp .dev.vars.example .dev.vars 2>/dev/null || true
# add OPENROUTER_API_KEY=... to .dev.vars
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

Build check:

```bash
pnpm build
```

## Customize for your own site

### Safe starter templates (non-destructive)

Your active site copy stays in:
- `content/concepts.md`
- `content/agent-instructions.md`
- `content/musings/*.md`

Owner-agnostic starter templates are provided in:
- `content/starter/concepts.template.md`
- `content/starter/agent-instructions.template.md`
- `content/starter/musing.template.md`

Use these only if you want to replace existing content.

### 1) Concepts (what the agent performs)

File: `content/concepts.md`

- Each `##` heading is one concept shown in the UI.
- `- id:` is the stable runtime key.
- `- themes:` helps the agent choose style/tooling.
- Paragraph text becomes elaboration in the system prompt.

Minimal concept section:

```md
## explain why this product should exist
- id: reason-to-exist
- themes: strategy, product, first-principles

Why this concept matters, in plain language.
```

### 2) Agent behavior and voice

File: `content/agent-instructions.md`

Use this file to control:
- voice and tone,
- guardrails and constraints,
- what the agent should prioritize while presenting.

### 3) Projects and writing

Directory: `content/musings/*.md`

Each file becomes:
- a card on `/musings`, and
- a detail page at `/musings/<slug>`.

Use frontmatter:

```md
---
title: WorkspaceOS
date: 2026-02-17
type: project
summary: One-line summary shown on the index.
---

Longer body copy in markdown.
```

### 4) Static pages

Edit:
- `src/app/pages/About.tsx`
- `src/app/pages/Contact.tsx`

These are intentionally static for simple owner/site copy.

## Runtime and model config

`wrangler.jsonc` contains key runtime vars:

- `AI_MODEL`: default model used for generation.
- `EXPERIENCE_V3`: homepage runtime selector (`"true"` enables v3).

Local secrets go in `.dev.vars`.
Production secrets:

```bash
wrangler secret put OPENROUTER_API_KEY
```

## Replay and token control

The home/session flow supports replay via `/?replay=1`.
If a session is cached locally, replay reuses prior generated steps to avoid unnecessary new generation/token spend.

## Project map

- `src/worker.tsx`: route wiring (pages + API endpoints)
- `src/app/agent/*`: prompt building + OpenRouter/session handlers
- `src/app/content/*`: markdown parsing + content loading helpers
- `src/app/pages/*`: route-level React pages
- `src/app/components/*`: UI primitives and session visuals
- `content/*`: editable concepts, instructions, and musings

## Smoke test checklist

Run `pnpm dev`, then verify:

1. `/` starts the agent session and streams a concept step.
2. Continue/back controls work and stay visible.
3. `/conventional`, `/about`, `/contact`, `/musings` render with shared navigation.
4. `/musings/<slug>` opens detail pages in the same layout.
5. `/?replay=1` restores replay without forcing a fresh full run.
6. Mobile viewport (for example `390x844`) is readable and controls are tappable.

## Deploy

```bash
pnpm release
```
