"use client";

import type { ProseBlock } from "../catalog";

const toneStyles: Record<string, string> = {
  warm: "text-amber-100/90",
  direct: "text-zinc-100",
  reflective: "text-violet-200/80 italic",
};

export default function Prose({ props }: { props: ProseBlock["props"] }) {
  const toneClass = props.tone ? toneStyles[props.tone] ?? "" : "";

  return (
    <div className={`text-sm leading-relaxed text-zinc-300 ${toneClass}`}>
      {props.content.split("\n\n").map((paragraph, i) => (
        <p key={i} className={i > 0 ? "mt-3" : ""}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
