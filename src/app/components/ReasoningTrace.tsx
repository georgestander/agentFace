"use client";

interface ReasoningTraceProps {
  text: string;
  isActive: boolean;
}

export default function ReasoningTrace({ text, isActive }: ReasoningTraceProps) {
  if (!text) return null;

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        isActive
          ? "opacity-100 translate-y-0"
          : "opacity-30 -translate-y-4 scale-95"
      }`}
    >
      <div className="max-w-2xl mx-auto px-6">
        <div className="font-mono text-sm leading-relaxed text-ink-muted tracking-wide">
          {text}
        </div>
      </div>
    </div>
  );
}
