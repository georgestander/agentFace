# Compass — Agent Face Performance Experience

## North Star
Deliver a polished, readable AI performance experience where reasoning, tool-based presentations, and browsing controls feel intentional and terminal-like.

## Current Target: v0.2
Create a responsive performer flow with concise reasoning, staged transitions, manual concept progression, non-repeating tool behavior, and stable routing.

## Phases

### Phase 1: Foundation Recovery
**Status:** done
**Plan:** —

- [x] Harden performer state transitions and streaming recovery paths.
- [x] Increase/normalize perform call robustness and request timeout handling.

### Phase 2: UX Shell and Navigation
**Status:** done
**Plan:** —

- [x] Intro/fin flow framing.
- [x] Persistent header/footer chrome.
- [x] Routing for conventional/alternate pages.

### Phase 3: Reasoning Compactness
**Status:** done
**Plan:** docs/plans/terminal-ux-no-jump-plan.md

- [x] Add explicit reasoning output limit to one brief sentence.
- [x] Replace dominant full-screen reasoning with compact UI.
- [x] Implement always-visible collapsible reasoning dropdown with terminal affordance.
- [x] Add complete non-redundant transition sequencing between phases.

### Phase 4: Tool Variety and Manual Progression
**Status:** done
**Plan:** docs/plans/terminal-ux-no-jump-plan.md

- [x] Add tool-use anti-repetition context from session history.
- [x] Remove automatic carousel-like jumps from presenters.
- [x] Validate distinct stage render outputs under constrained templates.

### Phase 5: Responsive Finalization
**Status:** done
**Plan:** docs/plans/terminal-ux-no-jump-plan.md

- [x] Finish responsive review for all pages in terminal palette.
- [x] Verify /about, /musings, /contact behavior and links.

## Decisions
- Use a monochrome terminal direction to avoid purple-themed ambiguity and match user preference.
- Keep reasoning short and secondary; avoid full-screen blocking text.
- Move toward deterministic anti-repetition tooling so stage interfaces stay emergent.

## Open Questions
- Should `/projects` stay as a redirect or be fully removed?
- Which tools should be exempt from anti-repetition to avoid dead-ends in later turns?

## Phase-Log Map
| Phase | log.ndjson entries |
|-------|--------------------|
| Foundation Recovery | 2026-02-13T08:58:22Z |
| UX Shell and Navigation | 2026-02-13T08:58:22Z |
| Reasoning Compactness | 2026-02-13T08:58:22Z |
| Tool Variety and Manual Progression | 2026-02-13T12:00:00Z |
| Responsive Finalization | 2026-02-13T08:58:22Z |
