"use client";

import AppShell from "../components/AppShell";
import StreamedCopy from "../components/StreamedCopy";

const CONTACT_BLOCKS = [
  { type: "p" as const, text: "If something here resonated \u2014 whether you're building something similar, looking for someone to build with, or just want to talk about how software should think \u2014 reach out." },
  { type: "code" as const, text: "email  george@georgestander.com" },
];

export default function Contact() {
  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-16 pt-20">
        <StreamedCopy heading="Contact" blocks={CONTACT_BLOCKS} />
      </div>
    </AppShell>
  );
}
