"use client";

import type { UIBlock } from "../catalog/catalog";
import Prose from "../catalog/components/Prose";
import ChoiceButtons from "../catalog/components/ChoiceButtons";
import ProjectCard from "../catalog/components/ProjectCard";
import ProjectGrid from "../catalog/components/ProjectGrid";

/**
 * Renders a validated UI block from the agent's response.
 * Maps the block's `type` to the corresponding React component.
 */
export default function UIBlockRenderer({
  block,
}: {
  block: UIBlock;
}) {
  try {
    switch (block.type) {
      case "Prose":
        return <Prose props={block.props} />;

      case "ChoiceButtons":
        return <ChoiceButtons props={block.props} />;

      case "ProjectCard":
        return <ProjectCard props={block.props} />;

      case "ProjectGrid":
        return (
          <ProjectGrid
            props={block.props}
            children={(block as any).children}
          />
        );

      default:
        console.warn("[UIBlock] Unknown component type:", (block as any).type);
        return null;
    }
  } catch (err) {
    console.error("[UIBlock] Render error:", err);
    return (
      <div className="text-xs text-red-400/60 italic">
        Failed to render component
      </div>
    );
  }
}
