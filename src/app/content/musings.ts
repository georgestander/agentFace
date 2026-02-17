import type { CopyBlock } from "@/app/components/StreamedCopy";
import { slugify } from "./markdown";

export type MusingType = "project" | "post";

export interface MusingLink {
  label: string;
  href: string;
}

export interface MusingEntry {
  slug: string;
  title: string;
  date: string;
  type: MusingType;
  summary: string;
  links: MusingLink[];
  body: string;
  blocks: CopyBlock[];
}

interface FrontmatterResult {
  meta: Record<string, string>;
  body: string;
}

const RAW_MUSINGS = import.meta.glob<string>("../../../content/musings/*.md", {
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

function parseType(value: string | undefined): MusingType {
  return value === "post" ? "post" : "project";
}

function isSafeHref(href: string): boolean {
  const normalized = href.trim().toLowerCase();
  return (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("mailto:")
  );
}

function formatLinkLabel(value: string): string {
  const normalized = value.replace(/[-_]+/g, " ").trim();
  if (!normalized) return "Link";

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseLinks(meta: Record<string, string>): MusingLink[] {
  const links: MusingLink[] = [];

  for (const [key, value] of Object.entries(meta)) {
    if (!(key.startsWith("link_") || key.startsWith("link-"))) continue;

    const href = value.trim();
    if (!isSafeHref(href)) continue;

    const label = formatLinkLabel(key.slice(5));
    links.push({ label, href });
  }

  return links;
}

function inferSlug(path: string): string {
  const match = path.match(/\/([^/]+)\.md$/);
  if (!match) return "musing";
  return slugify(match[1]);
}

function firstParagraph(blocks: CopyBlock[]): string {
  const block = blocks.find((entry) => entry.type === "p");
  return block?.text ?? "";
}

function parseEntry(path: string, markdown: string): MusingEntry {
  const { meta, body } = parseFrontmatter(markdown);
  const blocks = markdownToBlocks(body);

  const title = meta.title || "Untitled";
  const slug = meta.slug ? slugify(meta.slug) : inferSlug(path);
  const date = meta.date || "1970-01-01";
  const summary = meta.summary || firstParagraph(blocks) || "No summary provided.";
  const type = parseType(meta.type);
  const links = parseLinks(meta);

  return {
    slug,
    title,
    date,
    type,
    summary,
    links,
    body,
    blocks,
  };
}

function byDateDesc(a: MusingEntry, b: MusingEntry): number {
  const aTime = Date.parse(a.date);
  const bTime = Date.parse(b.date);
  const safeA = Number.isFinite(aTime) ? aTime : 0;
  const safeB = Number.isFinite(bTime) ? bTime : 0;
  return safeB - safeA;
}

export const MUSINGS: MusingEntry[] = Object.entries(RAW_MUSINGS)
  .map(([path, markdown]) => parseEntry(path, markdown))
  .sort(byDateDesc);

export function getMusingBySlug(slug: string): MusingEntry | undefined {
  return MUSINGS.find((entry) => entry.slug === slug);
}
