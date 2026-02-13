import { lazy, type ComponentType } from "react";
import TypographyDisplay from "./TypographyDisplay";
import NarrativeSequence from "./NarrativeSequence";
import RevealSequence from "./RevealSequence";
import Marginalia from "./Marginalia";
import Comparison from "./Comparison";

// Code-split: React Flow + ELK only loaded when concept_map is used
const ConceptMapFlow = lazy(() => import("./ConceptMapFlow"));

/** Map from tool name to its React renderer component */
export const TOOL_RENDERERS: Record<string, ComponentType<{ props: unknown; onReady?: () => void }>> = {
  typography_display: TypographyDisplay,
  narrative_sequence: NarrativeSequence,
  concept_map: ConceptMapFlow,
  reveal_sequence: RevealSequence,
  marginalia: Marginalia,
  comparison: Comparison,
};
