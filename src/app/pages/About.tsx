"use client";

import StaticPageLayout from "../components/StaticPageLayout";
import StreamedCopy from "../components/StreamedCopy";
import { ABOUT_CONTENT } from "../content/about";

export default function About() {
  return (
    <StaticPageLayout>
      <StreamedCopy heading={ABOUT_CONTENT.title} blocks={ABOUT_CONTENT.blocks} />
    </StaticPageLayout>
  );
}
