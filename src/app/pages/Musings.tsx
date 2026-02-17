"use client";

import StaticPageLayout from "../components/StaticPageLayout";
import StreamedCopy from "../components/StreamedCopy";

const MUSINGS_BLOCKS = [
  { type: "li" as const, text: "WorkspaceOS \u2014 Agents should have desks, not toolbars. A workspace-first approach to AI-assisted work." },
  { type: "li" as const, text: "Connexus \u2014 Thought is not linear \u2014 why is chat? A non-linear interface for exploring ideas." },
  { type: "li" as const, text: "Agent Face \u2014 This site. An autonomous AI performer that presents concepts using a set of visual tools. The portfolio piece is the portfolio itself." },
];

export default function Musings() {
  return (
    <StaticPageLayout>
      <StreamedCopy heading="Musings" blocks={MUSINGS_BLOCKS} />
    </StaticPageLayout>
  );
}
