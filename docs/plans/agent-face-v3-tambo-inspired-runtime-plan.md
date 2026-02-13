# Agent Face v3 - Tambo-Inspired Runtime (Without Running Tambo)

## Brief Summary
We will keep the current Cloudflare Worker app and borrow Tambo's strongest ideas locally: component protocol, thread/session store, streaming hooks, and interactable UI patterns. We will not run Tambo backend/runtime.

Core outcomes: no repeat inference for same session+step, less verbose/scrollable thought traces, always-on global layout on every page, emergent interaction intent, robust graph rendering with React Flow + ELK, token telemetry per step + session total, and no blank states.

## Locked Decisions
- Use Lazy + Prefetch generation strategy.
- Use Session + LocalStorage cache scope.
- Borrow Protocol + Hooks + UI patterns from Tambo.
- Use new step-oriented backend API.
- Replace concept map with React Flow + ELK.
- Keep monochrome brutalist visual system and make background feel alive.
- Do not run Tambo backend/service.

## Clarifications from v3 questions (defaults chosen)
1. Runtime order and coupling  
   - Phase 1 and Phase 2 are coupled. The runtime layer is useful only if cache reads short-circuit render on revisit, so they ship together.
   - Milestone M1: "local session state + step cache + prefetch + zero-re-infer on replay" (single checkpoint).

2. Feature flags  
   - Use one rollout flag: `EXPERIENCE_V3=true`.
   - Optional granular sub-flags are okay later (`V3_RUNTIME`, `V3_GRAPH`) but only after `EXPERIENCE_V3` is stable.
   - Legacy `/api/perform` keeps fallback under the same flag until parity completes.

3. API compatibility and migration  
   - New `/api/session/step` is a step-structured orchestration around the same OpenRouter tool-calling flow (same message/tool schema at baseline).  
   - No prompt/response shape change for model calls in the first phase.  
   - The migration goal is orchestration, cacheability, and deterministic replay, not a model-format pivot.
   - Until Phase 7, `uiMood` and `intentSpec` are client-derived from deterministic seed only.

4. Graph bundle size strategy  
   - `elkjs` usage stays, but load only when graph renderer is actually needed (code-split + dynamic import).  
   - Keep a fallback path using lightweight layout (simple layered layout / no layout lib) for small graphs or low-resource devices.  
   - This keeps full bundle pressure controlled; if performance regressions appear we can switch to `dagre` only for non-complex graphs.

5. BroadcastChannel conflict resolution  
   - Canonical lock lives in `localStorage` with expiry (`perf_v3_session_lock`), containing `{ sessionId, ownerTabId, expiresAt }`.  
   - On step request:
     - if no active lock or lock expired: acquire and generate.
     - if lock belongs to another live tab: subscribe to BroadcastChannel updates and wait/retry.
     - if stale lock, reclaim and broadcast ownership handoff.
   - This prevents duplicate generation for the same session/step across tabs.

6. Prefetch concurrency  
   - Default prefetch concurrency = 2 to avoid long waits on longer sessions.
   - Adaptive throttle: drop to 1 when network is weak/tab is backgrounded/mobile battery saver.
   - Always skip prefetch for already cached or in-flight steps.

7. Deterministic seed + model-provided intent/mood  
   - `seed = hash(sessionId + stepIndex + conceptId + promptVersion + model)` is the canonical seed.
   - Model may return `uiMood` / `intentSpec`; when present, we validate and prefer it.
   - If absent or invalid, we derive `uiMood`/intent deterministically from the seed for stable replay.
   - This gives creative richness while preserving deterministic back/refresh behavior.
   - For Phases 1-6, assume model metadata is absent and rely on seed derivation as the default path.

8. Non-click interaction discoverability  
   - A tiny persistent hint appears per intent mode, e.g. “Hold to continue,” “scroll down to advance,” or “tap the rail to move on.”  
   - Keyboard fallback remains in stable location (`Tab`/`Enter`/`Space`).
   - On first step, show a one-time micro-tour cue (2-second “how to advance” badge), then suppress.

9. ThoughtRail visibility  
   - Rail is always mounted as part of layout.  
   - In non-reasoning phases, it collapses to a compact chip.  
   - During `reasoning`/`reasoning-done`, it expands automatically to full height.

10. StreamedCopy for static pages  
   - Introduce a shared `StreamedCopy` data model:
     - `{ heading?: string, blocks: Array<{ type: "p"|"li"|"quote"|"code", text: string }> }`.
   - Existing static pages can be migrated incrementally: render arrays first, then optionally allow richer JSX content blocks.

## Important API / Interface / Type Changes

### New API endpoints
1. `POST /api/session/start`
- Request: `{ sessionId?: string, model: string, promptVersion: string }`
- Response: `{ sessionId: string, totalConcepts: number, cacheVersion: string, startedAt: string }`

2. `POST /api/session/step`
- Request: `{ sessionId: string, stepIndex: number, mode: "interactive" | "prefetch", priorSteps: number[], usedTools: string[] }`
- Response (SSE):
- `event: status` -> `{ phase: "generating" | "complete" | "error" }`
- `event: thought_delta` -> `{ delta: string }`
- `event: packet` -> `StepPacket`
- `event: usage` -> `TokenUsage`
- `event: done` -> `{ ok: true }`

3. `POST /api/session/prefetch`
- Request: `{ sessionId: string, fromStep: number, toStep: number }`
- Response: `{ queued: number[] }`
- Server can return immediately; client consumes queue state from local store.

4. Keep existing `/api/perform` temporarily behind feature flag as rollback path, then remove after parity.

### New core types
1. `StepPacket`
- `sessionId`, `stepIndex`, `conceptId`, `toolName`, `toolProps`, `thoughtShort`, `uiMood`, `intentSpec`, `backgroundSpec`, `tokenUsage`, `createdAt`.

2. `TokenUsage`
- `promptTokens`, `completionTokens`, `reasoningTokens?`, `totalTokens`, `provider`.

3. `IntentSpec`
- `label`, `interactionMode` (`click` | `tap` | `scroll` | `hold`), `placement` (`bottom-center` | `right-rail` | `inline-anchor`), `icon`.

4. `SessionShowState`
- `sessionId`, `currentStep`, `packetsByStep`, `prefetchQueue`, `inflightByStep`, `totals`.

5. `UiMood`
- `command-grid`, `dossier`, `telemetry`, `wireframe`, `manifesto` (seeded deterministic selection).

### Env/config additions
- `EXPERIENCE_V3=true|false`
- Existing `AI_MODEL` remains and is included in cache key versioning.
- Optional future fine-grain flags (`V3_RUNTIME`, `V3_GRAPH`, `V3_TOKENS`) can be introduced after stable rollout.

### Stream usage handling
- OpenRouter requests include usage reporting where supported.
- Parser/state accepts missing usage and falls back to estimated counters.

## Implementation Plan (decision-complete)

### Phase 1 - Tambo-Inspired Local Runtime Layer
1. Add `src/app/runtime/` modules:
- `component-protocol.ts`
- `thread-store.ts`
- `session-store.ts`
- `useShowSession.ts`
- `useStepPrefetch.ts`
- `useThoughtStream.ts`
- `useIntentEngine.ts`
- `useTokenLedger.ts`

2. Implement deterministic seed:
- `seed = hash(sessionId + stepIndex + conceptId + promptVersion + model)`.
- Seed drives mood, control copy, control placement, icon set, and background variant.
- Returning to a step reproduces the same exact intent/style.

3. Implement local persistence:
- Key: `agent-face:v3:{sessionId}:{model}:{promptVersion}`.
- Persist packets and totals in localStorage.
- Add cache-version invalidation on prompt/schema/model changes.
- Add tab-sync via `BroadcastChannel` to prevent duplicate generation from multiple tabs.

### Phase 2 - Cost Control and Inference Flow
1. Interactive request logic:
- Before calling API for a step: check `packetsByStep[step]`.
- If present: render immediately, zero inference.
- If absent: call `/api/session/step` in `interactive` mode.

2. Prefetch logic:
- After step `N` packet arrives, enqueue remaining steps `N+1..last` in-order.
- Concurrency = 2, cancelable, adaptive to connection state, paused when tab hidden.
- Prefetch skips cached or inflight steps.
- This gives first-step quick response + pregen remainder without full upfront wait.

3. No blank state guarantee:
- Always show shell, ambient backdrop, thought affordance, and loading skeleton.
- Stage never goes fully empty during transitions/errors.

### Phase 3 - Thought Trace + Token Telemetry
1. Replace current thought UI with `ThoughtRail`:
- Docked right rail on desktop, top collapsible drawer on mobile.
- Scrollable internal body (`max-height` with overflow).
- Display short thought only by default (hard clamp to one short sentence + char cap).
- Expand toggle for full trace.

2. Add style variation (deterministic per step):
- Variant templates: ticker, pulse-line, terminal ledger, dossier note.
- Never same visual shell for consecutive steps unless seeded collision guard triggers reroll.

3. Token affordance:
- Live provisional counter while streaming.
- Finalized per-step tokens from usage event.
- Footer badge shows session total.
- Fin page shows total tokens and average tokens/step.

### Phase 4 - Interaction Intent Engine (non-boring controls)
1. Replace static next and reveal controls with intent-driven controls:
- Labels rotate: `continue`, `go deeper`, `unfold`, `decode next`, `advance thread`.
- Interaction mode rotates per step: click, tap, hold, scroll threshold.
- Placement rotates per step zone (safe zones only, no overlap with key content).
- Include iconography (ASCII/line icons only, monochrome).

2. Accessibility fallback:
- Always expose keyboard-activated continue action in a stable location.
- If non-click mode fails, fallback to click CTA after timeout.

3. Renderer interaction contract:
- Each renderer receives `intentSpec`.
- Renderer must expose one primary interaction path and one fallback path.

### Phase 5 - Graph Replacement
1. Remove current custom SVG concept-map renderer logic.
2. Add dependencies:
- `@xyflow/react`
- `elkjs`
3. New `ConceptMapFlow` renderer:
- Build nodes/edges via validated schema.
- Auto-layout with ELK.
- Interaction: pan, zoom, focus node, touch support.
- Graceful fallback for invalid edges/node references.

### Phase 6 - Global Layout + Streamed Secondary Pages
1. Create `AppShell` used by all routes.
- Header and footer always visible on every page and state.
- Footer keeps `built with curiosity` + nav links.
- Pages no longer render isolated top-level wrappers.

2. Add `StreamedCopy` primitive for page content:
- Streams paragraph/line reveal with light staccato animation.
- Applies to `/about`, `/musings`, `/contact`, `/conventional`.
- No inference required; deterministic client-side stream animation.

3. Add `AmbientBackdrop`:
- Monochrome animated texture (grain + scanline + subtle grid drift).
- Seeded by session.
- `prefers-reduced-motion` compliant.

### Phase 7 - Prompt and Tool Behavior Hardening
1. Tighten system prompt:
- Thought output must be very short and concrete.
- Enforce variety by disallowing immediate tool repeats.
- Request style intent hints and interaction hints as metadata constraints.

2. Extend tool packet metadata generation:
- Always return tool props plus `uiMood` and `intentSpec`.
- If model omits metadata, client seed engine injects defaults.
- This is the first phase that intentionally changes model-facing prompt/metadata shape.

3. Keep OpenRouter compatibility:
- Preserve existing fallback behavior for unsupported params (`tool_choice`, `parallel_tool_calls`).

## File-Level Change Map
- New: `src/app/runtime/*` (session, prefetch, intent, telemetry hooks)
- New: `src/app/components/AppShell.tsx`
- New: `src/app/components/ThoughtRail.tsx`
- New: `src/app/components/AmbientBackdrop.tsx`
- New: `src/app/components/StreamedCopy.tsx`
- Update: `src/app/components/Stage.tsx`
- Update: `src/app/context/PerformanceContext.tsx`
- Update: `src/app/components/NavigationControls.tsx`
- Update: `src/app/components/ToolRenderer.tsx`
- Update/Replace: `src/app/tools/renderers/ConceptMap.tsx` (or `ConceptMapFlow.tsx`)
- Update: `src/app/tools/renderers/RevealSequence.tsx`
- Update: `src/app/tools/renderers/NarrativeSequence.tsx`
- Update: `src/app/pages/Home.tsx`, `About.tsx`, `Musings.tsx`, `Contact.tsx`, `Conventional.tsx`
- Update: `src/worker.tsx` for new endpoints
- Update: `src/app/agent/openrouter.ts`, `src/app/agent/parse-stream.ts`, `src/app/agent/system-prompt.ts`

## Test Cases and Scenarios
1. Cache and cost guarantees
- Visiting same step in same session does not call `/api/session/step`.
- Back/forward uses stored packet only.
- Refresh keeps packets for same session via localStorage.
- Prefetch never generates already cached steps.

2. No blank-state UX
- Idle->thinking->thought done->presenting->awaiting always shows visible affordance.
- Slow API and error paths still render shell + thought rail + fallback CTA.

3. Thought trace quality
- Thought is short and readable.
- Thought panel is scrollable and collapsible.
- Thought visual shell varies per step but remains deterministic on revisit.

4. Token telemetry
- Per-step token usage appears when step completes.
- Footer total increments correctly.
- Fin page total equals sum of packet totals.

5. Interaction intent variability
- Next/reveal labels and placement vary across steps.
- Non-click modes work on touch and desktop.
- Keyboard fallback always works.

6. Graph robustness
- Valid graph renders with readable layout.
- Invalid graph payload degrades gracefully.
- Mobile pan/zoom interaction remains smooth.

7. Global layout consistency
- Header/footer visible on all routes and states.
- Streamed content works on all conventional pages.
- No overlap between controls and critical content at mobile/tablet/desktop breakpoints.

## Assumptions and Defaults
- No voice I/O in this phase; interaction is text + gesture affordances.
- Session lifetime default: 24h local cache retention.
- Cache invalidation key includes `model + promptVersion + schemaVersion`.
- Prefetch starts after first interactive packet and runs sequentially.
- Randomness is deterministic per session-step for continuity.
- Feature flag `EXPERIENCE_V3=true` gates rollout; legacy flow remains until parity sign-off.
