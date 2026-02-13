"use client";

import { useChat } from "../../context/ChatContext";
import type { ChoiceButtonsBlock } from "../catalog";

const variantStyles: Record<string, string> = {
  primary:
    "bg-violet-600 hover:bg-violet-500 text-white border-violet-500/50",
  secondary:
    "bg-transparent hover:bg-zinc-800 text-zinc-200 border-zinc-700 hover:border-zinc-500",
  ghost:
    "bg-transparent hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200 border-transparent",
};

export default function ChoiceButtons({
  props,
}: {
  props: ChoiceButtonsBlock["props"];
}) {
  const { onChoiceSelect } = useChat();

  return (
    <div className="my-3">
      {props.prompt && (
        <p className="text-xs text-muted mb-2 uppercase tracking-wide">
          {props.prompt}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {props.choices.map((choice) => {
          const variant = choice.variant || "secondary";
          return (
            <button
              key={choice.value}
              onClick={() => onChoiceSelect?.(choice.value)}
              className={`px-4 py-2 text-sm rounded-lg border transition-all duration-200 cursor-pointer ${variantStyles[variant]}`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
