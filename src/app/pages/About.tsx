"use client";

import StaticPageLayout from "../components/StaticPageLayout";
import StreamedCopy from "../components/StreamedCopy";

const ABOUT_BLOCKS = [
  { type: "p" as const, text: "George Stander builds things that think. Software that has opinions. Interfaces that understand context. Systems with soul." },
  { type: "p" as const, text: "He believes every tool should know why it exists, that the best interface is a conversation, and that one person with clarity can build what usually takes a team." },
  { type: "p" as const, text: "This site is itself the demonstration \u2014 an agent that performs George's thinking, one concept at a time." },
];

export default function About() {
  return (
    <StaticPageLayout>
      <StreamedCopy heading="About" blocks={ABOUT_BLOCKS} />
    </StaticPageLayout>
  );
}
