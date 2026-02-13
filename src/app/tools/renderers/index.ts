import type { ComponentType } from "react";
import TypographyDisplay from "./TypographyDisplay";
import NarrativeSequence from "./NarrativeSequence";
import ConceptMap from "./ConceptMap";
import RevealSequence from "./RevealSequence";
import Marginalia from "./Marginalia";
import Comparison from "./Comparison";

/** Map from tool name to its React renderer component */
export const TOOL_RENDERERS: Record<string, ComponentType<{ props: unknown; onReady?: () => void }>> = {
  typography_display: TypographyDisplay,
  narrative_sequence: NarrativeSequence,
  concept_map: ConceptMap,
  reveal_sequence: RevealSequence,
  marginalia: Marginalia,
  comparison: Comparison,
};
