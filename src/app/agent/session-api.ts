import { env } from "cloudflare:workers";
import { buildPerformancePrompt } from "./system-prompt";
import { getOpenRouterTools } from "../tools/registry";
import { CONCEPTS } from "./concepts";
import {
  type SessionStartRequest,
  type SessionStartResponse,
  type SessionStepRequest,
  PROMPT_VERSION,
  SCHEMA_VERSION,
} from "../runtime/types";

// ---------------------------------------------------------------------------
// POST /api/session/start
// ---------------------------------------------------------------------------

export async function sessionStartHandler({ request }: { request: Request }) {
  let body: SessionStartRequest;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const model = body.model || (env as any).AI_MODEL || "anthropic/claude-sonnet-4";
  const promptVersion = body.promptVersion || PROMPT_VERSION;
  const sessionId =
    body.sessionId || `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const cacheVersion = `${model}:${promptVersion}:${SCHEMA_VERSION}`;

  const response: SessionStartResponse = {
    sessionId,
    totalConcepts: CONCEPTS.length,
    cacheVersion,
    startedAt: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// POST /api/session/step
// ---------------------------------------------------------------------------

export async function sessionStepHandler({ request }: { request: Request }) {
  let body: SessionStepRequest;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { sessionId, stepIndex, mode, priorSteps, usedTools } = body;
  if (!sessionId || typeof stepIndex !== "number") {
    return jsonError("sessionId and stepIndex required", 400);
  }

  const apiKey = (env as any).OPENROUTER_API_KEY;
  if (!apiKey) {
    return jsonError("OPENROUTER_API_KEY not configured", 500);
  }

  const model = (env as any).AI_MODEL || "anthropic/claude-sonnet-4";

  if (stepIndex < 0 || stepIndex >= CONCEPTS.length) {
    return jsonError(`stepIndex ${stepIndex} out of range`, 400);
  }

  const systemPrompt = buildPerformancePrompt(
    stepIndex,
    undefined,
    usedTools || []
  );
  const tools = getOpenRouterTools();

  // Build message history from prior steps (the client tells us which steps
  // were already completed so we can reconstruct the conversation context).
  const messages: Array<Record<string, unknown>> = [];
  // Prior steps are indices of already-completed steps. We don't have their
  // full content server-side, so we use lightweight placeholders that give
  // the model conversational continuity.
  if (priorSteps && priorSteps.length > 0) {
    for (const priorIdx of priorSteps) {
      const priorConcept = CONCEPTS[priorIdx];
      if (!priorConcept) continue;
      const fakeToolCallId = `prior-${sessionId}-${priorIdx}`;
      messages.push({
        role: "assistant",
        content: `Presented concept: "${priorConcept.bullet}"`,
        tool_calls: [
          {
            id: fakeToolCallId,
            type: "function",
            function: {
              name: "typography_display",
              arguments: JSON.stringify({ headline: priorConcept.bullet }),
            },
          },
        ],
      });
      messages.push({
        role: "tool",
        tool_call_id: fakeToolCallId,
        content: JSON.stringify({ rendered: true }),
      });
    }
  }

  messages.push({
    role: "user",
    content:
      priorSteps && priorSteps.length > 0
        ? "The visitor has seen your presentation and is ready for the next concept. Continue."
        : "The visitor is ready. Present the first concept now.",
  });

  console.log(
    `[session/step] sessionId=${sessionId} step=${stepIndex} mode=${mode} model=${model}`
  );

  try {
    const openRouterResponse = await callOpenRouter(
      apiKey,
      model,
      systemPrompt,
      messages,
      tools
    );

    if (!openRouterResponse.ok || !openRouterResponse.body) {
      const errText = await openRouterResponse.text();
      console.error("[session/step] API error:", openRouterResponse.status, errText);
      return sseError("AI service error");
    }

    // Transform the raw OpenRouter SSE stream into our v3 event format.
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const write = (event: string, data: unknown) => {
      writer.write(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    };

    // Process the upstream stream in the background
    (async () => {
      try {
        write("status", { phase: "generating" });

        const reader = openRouterResponse.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let reasoning = "";
        let toolCalls: Array<{
          id: string;
          name: string;
          argumentsJson: string;
        }> = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data: ")) continue;
            const data = trimmed.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const json = JSON.parse(data);
              if (json.error) {
                write("status", { phase: "error" });
                break;
              }

              const delta = json.choices?.[0]?.delta;
              if (!delta) continue;

              // Reasoning deltas
              let thoughtDelta = "";
              if (typeof delta.reasoning === "string" && delta.reasoning) {
                thoughtDelta = delta.reasoning;
              } else if (typeof delta.content === "string" && delta.content) {
                thoughtDelta = delta.content;
              } else if (Array.isArray(delta.reasoning_details)) {
                for (const detail of delta.reasoning_details) {
                  if (typeof detail?.text === "string" && detail.text) {
                    thoughtDelta += detail.text;
                  }
                }
              }

              if (thoughtDelta) {
                reasoning += thoughtDelta;
                write("thought_delta", { delta: thoughtDelta });
              }

              // Tool call deltas
              if (delta.tool_calls) {
                for (const tc of delta.tool_calls) {
                  const idx = tc.index ?? 0;
                  if (!toolCalls[idx]) {
                    toolCalls[idx] = { id: tc.id || "", name: tc.function?.name || "", argumentsJson: "" };
                  }
                  if (tc.id) toolCalls[idx].id = tc.id;
                  if (tc.function?.name) toolCalls[idx].name = tc.function.name;
                  if (tc.function?.arguments) {
                    toolCalls[idx].argumentsJson += tc.function.arguments;
                  }
                }
              }

              // Usage info (some providers include this in chunks)
              const usage = json.usage;
              if (usage) {
                write("usage", {
                  promptTokens: usage.prompt_tokens ?? 0,
                  completionTokens: usage.completion_tokens ?? 0,
                  reasoningTokens: usage.reasoning_tokens ?? undefined,
                  totalTokens: usage.total_tokens ?? 0,
                  provider: model,
                });
              }
            } catch {
              // Ignore parse errors on individual lines
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim() && buffer.trim().startsWith("data: ")) {
          const data = buffer.trim().slice(6).trim();
          if (data !== "[DONE]") {
            try {
              const json = JSON.parse(data);
              const usage = json.usage;
              if (usage) {
                write("usage", {
                  promptTokens: usage.prompt_tokens ?? 0,
                  completionTokens: usage.completion_tokens ?? 0,
                  reasoningTokens: usage.reasoning_tokens ?? undefined,
                  totalTokens: usage.total_tokens ?? 0,
                  provider: model,
                });
              }
            } catch {
              // Ignore
            }
          }
        }

        // Emit the completed packet
        if (toolCalls.length > 0 && toolCalls[0].name) {
          const tc = toolCalls[0];
          let toolProps: Record<string, unknown> = {};
          try {
            toolProps = JSON.parse(tc.argumentsJson);
          } catch {
            // Invalid JSON — emit error
            write("status", { phase: "error" });
            write("done", { ok: false });
            writer.close();
            return;
          }

          const concept = CONCEPTS[stepIndex];
          const packet = {
            sessionId,
            stepIndex,
            conceptId: concept.id,
            toolName: tc.name,
            toolProps,
            toolCallId: tc.id,
            thoughtShort: reasoning.slice(0, 120),
            thoughtFull: reasoning,
            // uiMood and intentSpec are client-derived in Phases 1-6
            uiMood: null,
            intentSpec: null,
            tokenUsage: null,
            createdAt: new Date().toISOString(),
          };

          write("packet", packet);
        } else {
          write("status", { phase: "error" });
        }

        write("status", { phase: "complete" });
        write("done", { ok: true });
      } catch (err) {
        console.error("[session/step] Stream processing error:", err);
        try {
          write("status", { phase: "error" });
          write("done", { ok: false });
        } catch {
          // Writer may already be closed
        }
      } finally {
        try {
          writer.close();
        } catch {
          // Already closed
        }
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[session/step] Error:", err);
    return sseError("Failed to reach AI service");
  }
}

// ---------------------------------------------------------------------------
// POST /api/session/prefetch
// ---------------------------------------------------------------------------

export async function sessionPrefetchHandler({ request }: { request: Request }) {
  let body: { sessionId: string; fromStep: number; toStep: number };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const { fromStep, toStep } = body;
  const queued: number[] = [];
  for (let i = fromStep; i <= toStep && i < CONCEPTS.length; i++) {
    queued.push(i);
  }

  return new Response(JSON.stringify({ queued }), {
    headers: { "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// OpenRouter call helper (reuses existing fallback logic)
// ---------------------------------------------------------------------------

async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: Array<Record<string, unknown>>,
  tools: Array<Record<string, unknown>>
): Promise<Response> {
  const endpoint = "https://openrouter.ai/api/v1/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": "https://georgestander.com",
    "X-Title": "Agent Face",
  };

  const baseBody = {
    model,
    stream: true,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    tools,
  };

  const doFetch = (
    toolChoice: "required" | "auto",
    includeParallel: boolean
  ) =>
    fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...baseBody,
        tool_choice: toolChoice,
        ...(includeParallel ? { parallel_tool_calls: false } : {}),
      }),
    });

  let response = await doFetch("required", true);

  if (!response.ok) {
    const errText = await response.text();
    const retryAuto = /tool_choice/i.test(errText) && (response.status === 400 || response.status === 404);
    const retryNoParallel = /parallel_tool_calls/i.test(errText);

    if (retryNoParallel) {
      console.warn("[session/step] Retrying without parallel_tool_calls");
      response = await doFetch(retryAuto ? "auto" : "required", false);
    } else if (retryAuto) {
      console.warn("[session/step] Retrying with tool_choice=auto");
      response = await doFetch("auto", true);
    }
  }

  return response;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function sseError(message: string): Response {
  const body = `event: status\ndata: ${JSON.stringify({ phase: "error" })}\n\nevent: done\ndata: ${JSON.stringify({ ok: false, error: message })}\n\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
