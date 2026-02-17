import type { CopyBlock } from "@/app/components/StreamedCopy";

interface FrontmatterResult {
  meta: Record<string, string>;
  body: string;
}

export interface AboutContent {
  title: string;
  blocks: CopyBlock[];
}

const RAW_ABOUT = import.meta.glob<string>("../../../content/about.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

function parseFrontmatter(markdown: string): FrontmatterResult {
  if (!markdown.startsWith("---\n")) {
    return { meta: {}, body: markdown.trim() };
  }

  const end = markdown.indexOf("\n---\n", 4);
  if (end === -1) {
    return { meta: {}, body: markdown.trim() };
  }

  const rawMeta = markdown.slice(4, end);
  const body = markdown.slice(end + 5).trim();
  const meta: Record<string, string> = {};

  for (const line of rawMeta.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^([a-zA-Z0-9_-]+):\s*(.+)$/);
    if (!match) continue;
    meta[match[1].toLowerCase()] = match[2].trim();
  }

  return { meta, body };
}

function markdownToBlocks(markdown: string): CopyBlock[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: CopyBlock[] = [];

  let inCode = false;
  let codeLines: string[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const text = paragraph.join(" ").replace(/\s+/g, " ").trim();
    if (text) {
      blocks.push({ type: "p", text });
    }
    paragraph = [];
  };

  const flushCode = () => {
    if (codeLines.length === 0) return;
    blocks.push({ type: "code", text: codeLines.join("\n") });
    codeLines = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        inCode = false;
        flushCode();
      } else {
        flushParagraph();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (trimmed.startsWith("- ")) {
      flushParagraph();
      blocks.push({ type: "li", text: trimmed.slice(2).trim() });
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      blocks.push({ type: "quote", text: trimmed.slice(2).trim() });
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: "quote", text: trimmed.replace(/^#{1,6}\s+/, "") });
      continue;
    }

    paragraph.push(trimmed);
  }

  flushParagraph();
  if (inCode) flushCode();
  return blocks;
}

const rawAbout = RAW_ABOUT["../../../content/about.md"] || "";
const { meta, body } = parseFrontmatter(rawAbout);
const parsedBlocks = markdownToBlocks(body);

export const ABOUT_CONTENT: AboutContent = {
  title: meta.title || "About",
  blocks:
    parsedBlocks.length > 0
      ? parsedBlocks
      : [
          {
            type: "p",
            text: "Add your About copy in content/about.md.",
          },
        ],
};
