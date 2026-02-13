import { env } from "cloudflare:workers";
import { buildPerformancePrompt } from "./system-prompt";
import { getOpenRouterTools } from "../tools/registry";

interface PerformRequest {
  messages: Array<Record<string, unknown>>;
  conceptIndex: number;
  interaction?: unknown;
}

/**
 * POST /api/perform handler
 *
 * Receives conversation history + concept index, builds the performance
 * system prompt, includes tool definitions, and streams back SSE with
 * both reasoning (content) and tool calls.
 */
export async function performHandler({ request }: { request: Request }) {
  let body: PerformRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, conceptIndex, interaction } = body;
  if (!Array.isArray(messages) || typeof conceptIndex !== "number") {
    return new Response(
      JSON.stringify({ error: "messages (array) and conceptIndex (number) required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const apiKey = (env as any).OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const model = (env as any).AI_MODEL || "anthropic/claude-sonnet-4";
  const systemPrompt = buildPerformancePrompt(conceptIndex, interaction);
  const tools = getOpenRouterTools();

  console.log("[perform] Request: conceptIndex=", conceptIndex, "messages count=", messages.length, "model=", model);

  try {
    const openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://georgestander.com",
          "X-Title": "Agent Face",
        },
        body: JSON.stringify({
          model,
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          tools,
          tool_choice: "auto",
        }),
      }
    );

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error("[perform] API error:", openRouterResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: "AI service error",
          status: openRouterResponse.status,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(openRouterResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[perform] Fetch error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to reach AI service" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
