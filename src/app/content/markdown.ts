/**
 * Lightweight markdown parsing helpers for content-driven site copy.
 *
 * The goal is predictable authoring, not full CommonMark support.
 * We parse only the subset we use in content/*.md files.
 */

export interface MarkdownSection {
  heading: string;
  body: string;
}

export interface SectionMeta {
  meta: Record<string, string>;
  content: string;
}

export function parseH2Sections(source: string): MarkdownSection[] {
  const lines = source.split(/\r?\n/);
  const sections: MarkdownSection[] = [];

  let currentHeading: string | null = null;
  let currentBody: string[] = [];

  const flush = () => {
    if (!currentHeading) return;
    sections.push({
      heading: currentHeading.trim(),
      body: currentBody.join("\n").trim(),
    });
  };

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      flush();
      currentHeading = match[1];
      currentBody = [];
      continue;
    }

    if (currentHeading) {
      currentBody.push(line);
    }
  }

  flush();
  return sections;
}

export function parseSectionMeta(body: string): SectionMeta {
  const lines = body.split(/\r?\n/);
  const meta: Record<string, string> = {};
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index++;
      break;
    }

    const match = line.match(/^- ([a-zA-Z0-9_-]+):\s*(.+)$/);
    if (!match) break;

    const key = match[1].trim().toLowerCase();
    const value = match[2].trim();
    meta[key] = value;
    index++;
  }

  const content = lines.slice(index).join("\n").trim();
  return { meta, content };
}

export function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

