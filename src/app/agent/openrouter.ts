import { env } from "cloudflare:workers";
import { buildSystemPrompt } from "./system-prompt";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
}

/**
 * POST /api/chat handler
 *
 * Receives conversation history, prepends the system prompt,
 * forwards to OpenRouter with streaming, and pipes the SSE
 * response straight back to the client.
 */
export async function chatHandler({ request }: { request: Request }) {
  // Parse request
  let body: ChatRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages } = body;
  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "messages must be an array" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Check for API key
  const apiKey = (env as any).OPENROUTER_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const model = (env as any).AI_MODEL || "anthropic/claude-sonnet-4";
  const systemPrompt = buildSystemPrompt();

  // Forward to OpenRouter
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
        }),
      }
    );

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error("[openrouter] API error:", openRouterResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: "AI service error",
          status: openRouterResponse.status,
        }),
        { status: 502, headers: { "Content-Type": "application/json" } }
      );
    }

    // Stream the response directly back to the client
    return new Response(openRouterResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[openrouter] Fetch error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to reach AI service" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
