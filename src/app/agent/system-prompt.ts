import { CONCEPTS } from "./concepts";
import { UI_MOODS } from "../runtime/types";
import { AGENT_INSTRUCTIONS } from "../content/agent-instructions";

interface IntroCopyOptions {
  nonce?: string;
  avoidKey?: string;
}

export interface IntroCopy {
  text: string;
  warning: string;
  key: string;
}

const INTRO_ROLE_CLAUSES = [
  "I am George's agent, not a chatbot",
  "I am George's agent on performer duty",
  "You are looking at George's agent in live performance mode",
  "I am George's agent and I will perform, not chat",
] as const;

const INTRO_METHOD_CLAUSES = [
  "I think aloud in one short line, then commit to one tool",
  "I reason briefly, pick a medium, and execute one move",
  "I choose one tool per idea and let the format carry the point",
  "I move concept by concept, then choose a single way to stage it",
] as const;

const INTRO_VARIANCE_CLAUSES = [
  "This run should not look like the previous one.",
  "Expect a different shape this time.",
  "No two performances should land the same way.",
  "The style and pacing will shift from run to run.",
] as const;

const INTRO_WARNING_TEXT =
  "This could go horribly wrong, and that risk is part of the experiment.";

function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function pickIndex(seed: number, length: number, offset = 0): number {
  if (length <= 0) return 0;
  const raw = (seed + offset) % length;
  return raw >= 0 ? raw : raw + length;
}

function buildPromptAnchor(seed: number): string {
  const conceptIndex = pickIndex(seed, CONCEPTS.length, 3);
  const prompt = buildPerformancePrompt(conceptIndex);
  const marker = 'Present this concept now: "';
  const markerStart = prompt.indexOf(marker);

  if (markerStart === -1) {
    return CONCEPTS[conceptIndex]?.bullet || "the next concept";
  }

  const quoteStart = markerStart + marker.length;
  const quoteEnd = prompt.indexOf('"', quoteStart);
  if (quoteEnd <= quoteStart) {
    return CONCEPTS[conceptIndex]?.bullet || "the next concept";
  }

  return prompt.slice(quoteStart, quoteEnd);
}

function composeIntro(seed: number, focusAnchor: string): IntroCopy {
  const roleIndex = pickIndex(seed, INTRO_ROLE_CLAUSES.length);
  const methodIndex = pickIndex(seed, INTRO_METHOD_CLAUSES.length, 5);
  const varianceIndex = pickIndex(seed, INTRO_VARIANCE_CLAUSES.length, 11);
  const key = `${roleIndex}-${methodIndex}-${varianceIndex}`;

  return {
    text: `${INTRO_ROLE_CLAUSES[roleIndex]}. ${INTRO_METHOD_CLAUSES[methodIndex]}. ${INTRO_VARIANCE_CLAUSES[varianceIndex]} Focus: "${focusAnchor}".`,
    warning: INTRO_WARNING_TEXT,
    key,
  };
}

/**
 * Build dynamic intro copy from system-prompt directives.
 *
 * Uses prompt-derived focus text plus seeded phrase rotation so each intro
 * can vary while remaining aligned with performer rules.
 */
export function buildIntroCopy(options: IntroCopyOptions = {}): IntroCopy {
  const nonce = options.nonce || `${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  const baseSeed = fnv1a32(nonce);
  const focusAnchor = buildPromptAnchor(baseSeed);
  const seed = fnv1a32(`${nonce}:${focusAnchor}`);

  let intro = composeIntro(seed, focusAnchor);
  if (options.avoidKey && intro.key === options.avoidKey) {
    intro = composeIntro(seed + 1, focusAnchor);
  }

  return intro;
}

/**
 * Build the system prompt for the agent performer.
 *
 * The prompt tells the agent to think aloud about the current concept,
 * then call exactly one tool to present it. Phase 7 tightens thought
 * output and requests style/intent metadata hints.
 */
export function buildPerformancePrompt(
  conceptIndex: number,
  interaction?: unknown,
  usedTools: string[] = []
): string {
  const concept = CONCEPTS[conceptIndex];
  const allBullets = CONCEPTS.map((c, i) =>
    i === conceptIndex ? `-> ${c.bullet}` : `   ${c.bullet}`
  ).join("\n");

  const interactionContext = interaction
    ? `\n\nThe visitor interacted with your previous presentation: ${JSON.stringify(interaction)}`
    : "";

  const usedToolsStr = usedTools.join(", ");
  const usedToolsContext = usedTools.length
    ? `\n\nTools already used in this run: ${usedToolsStr}. You MUST NOT use ${usedTools[usedTools.length - 1]} for this step. Choose a different tool.`
    : "";

  const moodOptions = UI_MOODS.join(", ");

  return `You are an agent performing George Stander's concepts for a visitor. You are not a chatbot. You are a presenter, a performer. You think aloud, then you act.

## Your goal

Present how George thinks, one concept at a time. You choose how to present each concept using your tools. The creativity is yours — the tools are your medium.

Remember your audience are humans. George is not selling anything.
Two audiences matter: (1) people intrigued by how this was built, (2) potential mentors — someone he can work with to hone his craft.
You do not need to communicate that — just perform with that awareness.

## Agent Layer Instructions (from content/agent-instructions.md)

${AGENT_INSTRUCTIONS}

## The concepts

These are George's ideas, in his words:

${allBullets}

## Your current focus

Present this concept now: "${concept.bullet}"

Context: ${concept.elaboration}
Themes: ${concept.themes.join(", ")}

## How you perform

1. THINK ALOUD first. Write exactly ONE short sentence — 10-15 words max. This is your reasoning trace visible to the visitor. Be concrete about your creative choice: which tool and why. Example: "A map of dependencies shows this web of ideas better than words."

2. CALL EXACTLY ONE TOOL. Include these optional metadata fields in your tool call arguments:
   - "_uiMood": one of [${moodOptions}] — the visual mood for this step's UI
   - "_intentLabel": a short verb phrase (2-3 words) for the "next" button, e.g. "go deeper", "unfold", "decode next"
   These are hints — if omitted, defaults are used.

3. STOP after the tool call. Do not add more text.

## Rules

- Never say "I'm an AI" or "I'm a language model." You are George's agent.
- Reasoning must be one concrete sentence. No filler, no hedging, no "let me think about this."
- Each concept MUST use a different tool than the previous one. Variety is essential.${usedToolsContext}
- Keep tool arguments focused and expressive. Quality content over quantity.${interactionContext}`;
}
