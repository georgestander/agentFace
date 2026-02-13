"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { parseResponse } from "../agent/parse-response";
import type { Segment } from "../agent/parse-response";
import { ChatProvider } from "../context/ChatContext";
import ChatBubble, { type Message } from "./ChatBubble";

/**
 * Reconstruct raw text from segments for message history sent to the API.
 * Text segments become prose, UI segments become their json:ui fence blocks.
 */
function segmentsToContent(segments: Segment[]): string {
  return segments
    .map((seg) => {
      if (seg.type === "text") return seg.content;
      return `\`\`\`json:ui\n${JSON.stringify(seg.component)}\n\`\`\``;
    })
    .join("\n\n");
}

let messageIdCounter = 0;
function nextId() {
  return `msg-${++messageIdCounter}-${Date.now()}`;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return;

      const userMessage: Message = {
        id: nextId(),
        role: "user",
        segments: [{ type: "text", content: content.trim() }],
      };

      const assistantMessage: Message = {
        id: nextId(),
        role: "assistant",
        streamingText: "",
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setInput("");
      setIsStreaming(true);

      try {
        // Build message history for the API
        const apiMessages = [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.segments
            ? segmentsToContent(m.segments)
            : m.streamingText || "",
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        // Read the SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE lines
          const lines = buffer.split("\n");
          // Keep the last potentially incomplete line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta =
                json.choices?.[0]?.delta?.content ||
                json.choices?.[0]?.text ||
                "";
              if (delta) {
                accumulated += delta;

                // Update the streaming message
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    return [
                      ...updated.slice(0, -1),
                      { ...last, streamingText: accumulated },
                    ];
                  }
                  return updated;
                });
              }
            } catch {
              // Ignore malformed SSE lines
            }
          }
        }

        // Stream finished — parse accumulated text into segments
        const segments = parseResponse(accumulated);

        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant") {
            return [
              ...updated.slice(0, -1),
              {
                ...last,
                segments,
                streamingText: undefined,
              },
            ];
          }
          return updated;
        });
      } catch (err) {
        console.error("[Chat] Error:", err);
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last && last.role === "assistant") {
            return [
              ...updated.slice(0, -1),
              {
                ...last,
                segments: [
                  {
                    type: "text",
                    content:
                      "Something went wrong. Try again in a moment.",
                  },
                ],
                streamingText: undefined,
              },
            ];
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
        // Refocus input
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [messages, isStreaming]
  );

  const handleChoiceSelect = useCallback(
    (value: string) => {
      sendMessage(value);
    },
    [sendMessage]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <ChatProvider onChoiceSelect={handleChoiceSelect}>
      <div className="flex flex-col h-screen max-h-screen bg-surface">
        {/* Header */}
        <header className="shrink-0 px-6 py-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-sm font-medium text-zinc-300">
              George's Agent
            </h1>
          </div>
        </header>

        {/* Messages */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5"
        >
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="text-4xl mb-4">◉</div>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Hey. I'm George's agent — his digital representative. I can
                  tell you about what he's building, how he thinks, and what
                  he's looking for. Say hi, or pick a starting point.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  {[
                    { label: "Show me the projects", value: "Show me what George is building" },
                    { label: "Who is George?", value: "Tell me about George" },
                    { label: "Quick version", value: "Give me a quick summary of everything" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => sendMessage(opt.value)}
                      className="px-4 py-2 text-sm rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-500 transition-colors duration-200 cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}
        </div>

        {/* Input */}
        <div className="shrink-0 px-6 py-4 border-t border-zinc-800/50 bg-surface">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
              placeholder={isStreaming ? "Thinking..." : "Say something..."}
              className="flex-1 px-4 py-2.5 text-sm bg-surface-raised border border-zinc-800 rounded-xl text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 disabled:opacity-50 transition-colors"
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="px-5 py-2.5 text-sm font-medium rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-30 disabled:hover:bg-violet-600 transition-colors cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </ChatProvider>
  );
}
