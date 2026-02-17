# Agent Face

A concept-led portfolio where an agent presents ideas one step at a time.

Instead of a static homepage, the site runs a guided session:
- the agent reasons briefly,
- chooses one visual tool,
- presents a concept,
- and advances through a deterministic concept sequence.

## Why this exists

This project is built around one core thesis:

> Show up every day and make things that have soul. Things with story, feeling, and a reason to exist.

The site demonstrates that thesis through behavior, not just copy.

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

## How to steer the agent with content

The easiest way to customize this project is editing markdown in `content/`.

### 1) Concepts (agent path + concept UI)

File: `content/concepts.md`

- Each `##` heading is one concept bullet shown in UI.
- `- id:` is the stable runtime key.
- `- themes:` helps the agent decide tool/style.
- Paragraph text becomes concept elaboration in the system prompt.

Minimal concept section:

```md
## find the reason for things to exist
- id: reason-to-exist
- themes: philosophy, purpose, first-principles

Why this concept matters, in plain language.
```

### 2) Agent layer instructions (system steering)

File: `content/agent-instructions.md`

This is the editable "agent layer". Put voice, stance, guardrails, and thesis guidance here.

Use this file to control:
- how the agent frames ideas,
- what it should prioritize,
- and how strongly it should reference your thesis.

### 3) Musings (projects + writing)

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

## Static pages

- `src/app/pages/About.tsx`
- `src/app/pages/Contact.tsx`

These are intentionally static right now for simple site-level copy.

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
2. continue/back controls work and stay visible.
3. `/conventional`, `/about`, `/contact`, `/musings` render with shared top nav.
4. `/musings/<slug>` opens detail pages in same layout.
5. `/?replay=1` restores replay without forcing a fresh full run.
6. Mobile viewport (e.g. 390x844) is readable and controls are tappable.

## Deploy

```bash
pnpm release
```

For production secrets:

```bash
wrangler secret put OPENROUTER_API_KEY
```
