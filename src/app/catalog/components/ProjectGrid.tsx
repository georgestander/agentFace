"use client";

import type { ProjectGridBlock, ProjectCardBlock } from "../catalog";
import ProjectCard from "./ProjectCard";

const columnClasses: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

export default function ProjectGrid({
  props,
  children,
}: {
  props: ProjectGridBlock["props"];
  children?: ProjectCardBlock[];
}) {
  const cols = props.columns || 2;
  const gridClass = columnClasses[cols] || columnClasses[2];

  return (
    <div className={`grid ${gridClass} gap-3 my-3`}>
      {children?.map((child, i) => (
        <ProjectCard key={i} props={child.props} />
      ))}
    </div>
  );
}
