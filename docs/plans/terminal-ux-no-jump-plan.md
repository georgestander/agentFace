# Plan: Agent Performer — Terminal UI, Responsiveness, and Stability Pass

## Context
The performer flow is functional but still feels abrupt and generic. We need a polished terminal-inspired interface that is fast-feeling, readable, and intentionally styled across every state. The agent should stream short reasoning in a compact, always-available panel while preserving control in the UI.

## Core Constraints
- Model can be any OpenRouter tool-capable model (no Claude-specific assumptions).
- Reasoning should remain visible but secondary, not dominant.
- No auto-advancing carousel-style tool presentations.
- Every page and state must remain responsive.
- Keep palette strictly monochrome (white/black with greys), terminal aesthetic.

## Key UX Goals
1. Always show compact reasoning affordance during thinking.
2. Remove dead air between states.
3. Ensure concept progression is controlled by the user.
4. Make tool outputs feel less repetitive and more emergent.
5. Make header/footer/chrome persistent and minimal throughout experience.
6. Ensure all pages render cleanly on small/large viewports.

## Theme Direction
- Terminal UI:
  - Base: white and black with layered grey tones.
  - Distinct interfaces per stage/tool (no repetitive one-size UI).
  - Strong typographic contrast, minimal glassmorphism, hard edges.

- Components:
  - Header: `George Stander` fixed top-left (from start through complete).
  - Footer: left `built with curiosity`, right side links:
    - `About George`
    - `Musings`
    - `Contact George`
  - Footer always visible after the intro has loaded (or with whichever rule already defines chrome visibility).

## Required Changes (current pass)

### 1) Reasoning panel redesign
- File: `src/app/components/ReasoningTrace.tsx`
- Implement always-visible compact dropdown/badge UI.
- Keep label "Agent" visible at all times.
- While streaming: show animated thinking indicator (terminal dots / pulse).
- Streaming text should be short/concise; if long, keep it collapsible.
- After stream end: expose full captured reasoning in collapsible panel.

- File: `src/app/agent/system-prompt.ts`
- Reduce reasoning output to one brief sentence.
- Keep `1-3 sentence` guidance aligned to concise response requirement.

### 2) Stage affordance and no blank transitions
- File: `src/app/components/Stage.tsx`
- Rework positioning so reasoning UI sits in bottom-center while preserving tool render center.
- Add visual thinking affordance as soon as reasoning begins.
- `idle -> reasoning -> reasoning-done -> presenting` transitions should never feel empty.
- Add graceful fallback/error/recovery while preserving previous state machine semantics.

### 3) Tool variety and stage uniqueness
- File: `src/app/agent/system-prompt.ts`
- Add tool-use constraints so the model does not repeat tool kinds too often in one run.
- Maintain this context across turns and include in prompt.

- File: `src/app/components/Stage.tsx` / `src/app/agent/openrouter.ts`
- Pass used tools from history into request body/prompt assembly.

### 4) Carousel / sequence controls
- Files: any tool renderers that auto-advance.
- `NarrativeSequence` (and any auto-ticking carousel-like renderer): convert to manual reveal where possible.
- No automatic jumping between beats on mount.
- User actions should trigger progression where feasible.
- If auto timing exists by design, provide explicit pause/next or user confirmation.

### 5) Streaming text behavior
- Keep reasoning text stream-capable in panel and/or tool presentation context.
- Ensure new text can stream in (don’t hide all reasoning behind delayed state transitions).

### 6) Responsive shell and pages
- Files:
  - `src/app/pages/Home.tsx`
  - `src/app/pages/About.tsx` (to be created)
  - `src/app/pages/Musings.tsx` (renamed from /projects in this pass)
  - `src/app/pages/Contact.tsx`
  - any terminal shell/layout wrappers
- Ensure spacing/typography/layout adapts from mobile to desktop.

### 7) Routing update
- File: `src/worker.tsx`
- Ensure pages are available:
  - `/about`
  - `/musings` (preferred canonical label)
  - `/contact`
- Keep legacy compatibility where safe (optional redirect from `/projects` to `/musings` if required).

## Validation Checklist
- `pnpm build` passes after each phase.
- `pnpm dev` confirms:
  - reasoning panel is visible and always compactly available,
  - no blank screens during phase transitions,
  - no auto-jumping tool sequence behavior,
  - tool outputs vary in rendering pattern across concepts,
  - footer/header remain visible in intended phases,
  - all screens remain responsive,
  - `/about`, `/musings`, and `/contact` render correctly.

## Out of Scope for this pass
- Rewriting tool renderers for content quality unless required for manual controls.
- New backend/model capability beyond compatible OpenRouter tool-calling models.

## Scenario Coverage Matrix

### S0 — Intro and Chrome
- **Scenario:** Load `/` and observe intro, header, footer.
- **Acceptance checks:** intro appears with typed text, "yes, show me" and "no, just show me the site" appear; header visible top-left; footer visible bottom with links.
- **Validation:** `pnpm dev`, open `/`; manual verification in browser.

### S1 — Reasoning + Show Me
- **Scenario:** Initial concept performs from idle and returns to reasoning-done.
- **Acceptance checks:** phase is `reasoning` with always-visible dropdown + animated dots; tool response lands in `reasoning-done`; reasoning panel can collapse/expand; "show me →" appears.
- **Validation:** `pnpm dev`, trigger first assistant turn; confirm UI sequence.

### S2 — Present + Completion Controls
- **Scenario:** User accepts show-me and tool renders.
- **Acceptance checks:** presenter appears without jumping; `next →` is available only in `awaiting`.
- **Validation:** manual flow on `/` while not in intro.

### S3 — Manual Renderer Progression
- **Scenario:** Model uses `narrative_sequence` and `concept_map`.
- **Acceptance checks:** no automatic beat/node auto-advance without interaction; "next beat", "show conclusion", "reveal next node" control each step.
- **Validation:** manual interaction with synthetic renderer payloads during dev.

### S4 — Tool Variety / Recovery
- **Scenario:** Tool reuse attempted by model; API incompatibilities.
- **Acceptance checks:** prompt includes `usedTools`; tool repeats reduced; if `tool_choice`/`parallel_tool_calls` unsupported, fallback request succeeds.
- **Validation:** `performHandler` path testing with simulated 400 responses containing failure patterns (`tool_choice`, `parallel_tool_calls`).

### S5 — Browsing History
- **Scenario:** After at least one concept, open previous entries.
- **Acceptance checks:** older renderings are accessible, reasoning collapses in history by default, `← back` / `next →` controls are available, and concept list entries can jump to history.
- **Validation:** manual verification after advancing a few concepts.

### S6 — Routing + Responsive Pages
- **Scenario:** Navigate `/about`, `/musings`, `/contact`, `/conventional`, `/projects`.
- **Acceptance checks:** each route renders at all viewport tiers without horizontal overflow; footer links remain readable; header links function.
- **Validation:** `pnpm dev` + route smoke checks (`/`, `/conventional`, `/about`, `/musings`, `/contact`, `/projects`) at narrow/medium/desktop sizes.
