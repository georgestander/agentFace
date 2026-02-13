"use client";

import AppShell from "../components/AppShell";
import StreamedCopy from "../components/StreamedCopy";

const ABOUT_BLOCKS = [
  { type: "p" as const, text: "George Stander builds things that think. Software that has opinions. Interfaces that understand context. Systems with soul." },
  { type: "p" as const, text: "He believes every tool should know why it exists, that the best interface is a conversation, and that one person with clarity can build what usually takes a team." },
  { type: "p" as const, text: "This site is itself the demonstration \u2014 an agent that performs George's thinking, one concept at a time." },
];

export default function About() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-16 pt-20">
        <StreamedCopy heading="About" blocks={ABOUT_BLOCKS} />
      </div>
    </AppShell>
  );
}
