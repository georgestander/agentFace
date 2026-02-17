import conceptsMarkdown from "../../../content/concepts.md?raw";
import {
  parseCsv,
  parseH2Sections,
  parseSectionMeta,
  slugify,
} from "@/app/content/markdown";

export interface Concept {
  /** Short identifier for internal tracking */
  id: string;
  /** The poetic/cryptic bullet point shown in the concept box UI */
  bullet: string;
  /** Longer description for the system prompt — gives the agent context */
  elaboration: string;
  /** Tags/themes for the agent to consider when choosing tools */
  themes: string[];
}

function parseConcepts(markdown: string): Concept[] {
  const sections = parseH2Sections(markdown);

  const concepts = sections
    .map((section): Concept | null => {
      const bullet = section.heading.trim();
      if (!bullet) return null;

      const { meta, content } = parseSectionMeta(section.body);
      const id = meta.id ? slugify(meta.id) : slugify(bullet);
      const themes = parseCsv(meta.themes);

      if (!id || !content) return null;

      return {
        id,
        bullet,
        elaboration: content.replace(/\s+/g, " ").trim(),
        themes: themes.length > 0 ? themes : ["concept"],
      };
    })
    .filter((concept): concept is Concept => concept !== null);

  if (concepts.length === 0) {
    throw new Error(
      "No concepts parsed from content/concepts.md. Add at least one `##` concept section."
    );
  }

  return concepts;
}

export const CONCEPTS: Concept[] = parseConcepts(conceptsMarkdown);
