# Out-of-Credits Fail-Safe Plan

## Goal

When the live agent session hits API credit exhaustion (or equivalent provider quota failure), the user should:

1. See a clear, human message.
2. Be automatically redirected to `/conventional`.
3. Continue browsing without getting stuck in a broken loop.

This keeps the experience resilient and protects token spend expectations.

## Scope

In scope:
- Detect out-of-credits failures in session generation paths.
- Emit structured fatal error events to client runtime.
- Show a brief user-facing message, then fallback to `/conventional`.
- Add a contextual notice on the conventional page for fallback arrivals.
- Guard against repeated redirect loops.

Out of scope:
- Billing dashboards or proactive top-up flows.
- Provider-specific credit management UI.

## Current Behavior (Baseline)

- Session generation errors are currently flattened into generic messages (for example: `AI service error` / `The agent stumbled`).
- No first-class distinction for credit exhaustion.
- No automatic route fallback to `/conventional`.

## Proposed Design

### 1. Server-side error classification

File: `src/app/agent/session-api.ts`

Add a normalized classifier for provider failures:
- Detect from non-stream response status:
  - `402` (primary signal)
  - optional fallback `429` when provider encodes quota that way
- Detect from streamed error payloads (`json.error`) by checking:
  - `code` fields matching quota/credits patterns
  - message text containing `insufficient credits`, `out of credits`, `quota`, or similar

Normalize into an internal fatal type:
- `OUT_OF_CREDITS`

### 2. Structured SSE fatal event contract

Instead of only generic `status:error`, emit a structured event when credits are exhausted.

Example shape:

```json
{
  "type": "OUT_OF_CREDITS",
  "message": "Live agent is paused because API credits are exhausted.",
  "fallbackPath": "/conventional?fallback=credits"
}
```

Recommended event name:
- `fatal`

### 3. Client runtime handling (interactive path)

File: `src/app/runtime/useShowSession.ts`

On `fatal` event with `type === "OUT_OF_CREDITS"`:
- Stop current step handling safely.
- Set a dedicated user-facing error state.
- Disable further auto-step and retry behavior for this session.
- Trigger redirect to `fallbackPath` after a short delay (about 1.5-3s).

### 4. Prefetch behavior guard

File: `src/app/runtime/useStepPrefetch.ts`

If prefetch receives out-of-credits failure:
- Stop prefetch queue processing.
- Do not spam retries.
- Optionally mark a shared runtime flag so interactive flow can surface consistent fallback behavior.

### 5. UX: short message before redirect

File: `src/app/components/StageV3.tsx`

Show a clear transitional message:
- "Live agent is paused (API credits exhausted). Switching to conventional view."

Then navigate to fallback route.

### 6. Conventional page fallback notice

File: `src/app/pages/Conventional.tsx`

If URL includes `?fallback=credits`:
- show a subtle top notice so users know why they arrived there.

Example copy:
- "Live agent is temporarily unavailable due to API credit limits. You are viewing the conventional version."

### 7. Loop prevention

Use `sessionStorage` one-time flag, for example:
- `agent-face:fallback:credits:<sessionId>`

Behavior:
- Redirect once per session on credit exhaustion.
- Prevent repeated redirect attempts if multiple failures fire.

## Error Contract (Suggested)

### Server -> Client SSE

- `event: fatal`
- `data`:
  - `type`: `OUT_OF_CREDITS | PROVIDER_UNAVAILABLE | UNKNOWN_FATAL`
  - `message`: user-safe string
  - `fallbackPath`: optional string

### Client state (suggested extension)

Add fatal fields in session state:
- `fatalType?: "OUT_OF_CREDITS" | "PROVIDER_UNAVAILABLE" | "UNKNOWN_FATAL"`
- `fallbackPath?: string`
- `isFallbackRedirecting?: boolean`

## Rollout Steps

1. Implement server classification + fatal event emission.
2. Implement client fatal handling + redirect guard.
3. Add conventional fallback notice.
4. Test normal path regression (no behavior change when credits available).
5. Test forced failure path using mocked `402` and simulated stream error.

## Smoke Test Checklist

### Happy path
- Start session on `/`.
- Confirm normal reasoning/presentation/advance still works.
- Confirm no unexpected redirect.

### Credit exhaustion path (forced)
- Simulate provider `402` at `/api/session/step`.
- Confirm stage shows explicit message.
- Confirm auto-redirect to `/conventional?fallback=credits`.
- Confirm conventional notice appears.
- Confirm no redirect loop on refresh or repeated failures.

### Mobile
- Validate message readability and tap safety before redirect.
- Validate fallback notice layout on small viewport.

## Risks and Mitigations

- Risk: Provider error formats vary.
  - Mitigation: layered detection (status + code + message heuristics).

- Risk: False positives on generic throttling.
  - Mitigation: keep `OUT_OF_CREDITS` strict; route non-credit failures to normal retry/error path.

- Risk: Multiple async flows emit fatal concurrently.
  - Mitigation: one-time redirect guard in `sessionStorage`.

## Why this is worth sharing in Musings

This is a practical resilience pattern for AI-native products:
- graceful degradation from live agent to deterministic site,
- clear user communication,
- no dead-end states,
- lower operational surprise when credits run out.

Working title for a future post:
- **Designing AI Experiences That Fail Gracefully: Credit Exhaustion as a First-Class State**
