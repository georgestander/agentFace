"use client";

import type { Segment } from "../agent/parse-response";
import UIBlockRenderer from "./UIBlock";

export interface Message {
  id: string;
  role: "user" | "assistant";
  segments?: Segment[];
  streamingText?: string;
}

export default function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  // During streaming, show raw text
  if (message.streamingText !== undefined && !message.segments) {
    return (
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        <div
          className={`max-w-[85%] md:max-w-[70%] ${
            isUser
              ? "bg-violet-600/20 border-violet-500/30 text-violet-100"
              : ""
          }`}
        >
          {isUser ? (
            <div className="px-4 py-2.5 rounded-2xl bg-violet-600/20 border border-violet-500/30">
              <p className="text-sm text-violet-100">{message.streamingText}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {message.streamingText || (
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-pulse [animation-delay:300ms]" />
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // After parsing, render segments
  const segments = message.segments || [];

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] md:max-w-[70%]`}>
        {isUser ? (
          <div className="px-4 py-2.5 rounded-2xl bg-violet-600/20 border border-violet-500/30">
            <p className="text-sm text-violet-100">
              {segments
                .filter((s) => s.type === "text")
                .map((s) => (s as any).content)
                .join(" ")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {segments.map((segment, i) => {
              if (segment.type === "text") {
                return (
                  <p
                    key={i}
                    className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap"
                  >
                    {segment.content}
                  </p>
                );
              }
              if (segment.type === "ui") {
                return <UIBlockRenderer key={i} block={segment.component} />;
              }
              return null;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
