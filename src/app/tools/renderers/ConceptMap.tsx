"use client";

import { useEffect, useState } from "react";
import type { ConceptMapProps } from "../definitions/concept-map";

interface Props {
  props: unknown;
  onReady?: () => void;
}

export default function ConceptMap({ props, onReady }: Props) {
  const { nodes, edges, centerNode } = props as ConceptMapProps;
  const [revealed, setRevealed] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (revealed && onReady) {
      const timer = setTimeout(onReady, 1200);
      return () => clearTimeout(timer);
    }
  }, [revealed, onReady]);

  // Position nodes in a circle around the center
  const center = centerNode || nodes[0]?.id;
  const centerIdx = nodes.findIndex((n) => n.id === center);
  const otherNodes = nodes.filter((n) => n.id !== center);

  const radius = Math.min(280, 35 * otherNodes.length);
  const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

  const positions: Record<string, { x: number; y: number }> = {};
  positions[center] = { x: 50, y: 50 };

  otherNodes.forEach((node, i) => {
    const angle = angleStep * i - Math.PI / 2;
    positions[node.id] = {
      x: 50 + Math.cos(angle) * 30,
      y: 50 + Math.sin(angle) * 30,
    };
  });

  const hoveredDesc = hoveredNode
    ? nodes.find((n) => n.id === hoveredNode)?.description
    : null;

  return (
    <div className="flex items-center justify-center h-full w-full px-8">
      <div className="relative w-full max-w-2xl aspect-square">
        {/* Edges (SVG) */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
        >
          {edges.map((edge, i) => {
            const from = positions[edge.from];
            const to = positions[edge.to];
            if (!from || !to) return null;

            return (
              <g key={i}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#d6d3d1"
                  strokeWidth="0.3"
                  className={`transition-all duration-700 ${
                    revealed ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ transitionDelay: `${300 + i * 100}ms` }}
                />
                {edge.label && (
                  <text
                    x={(from.x + to.x) / 2}
                    y={(from.y + to.y) / 2 - 1.5}
                    textAnchor="middle"
                    className={`fill-stone-400 transition-opacity duration-500 ${
                      revealed ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ fontSize: "2.5px", transitionDelay: `${500 + i * 100}ms` }}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node, i) => {
          const pos = positions[node.id];
          if (!pos) return null;
          const isCenter = node.id === center;
          const delay = isCenter ? 0 : 200 + i * 150;

          return (
            <div
              key={node.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 cursor-default ${
                revealed ? "opacity-100 scale-100" : "opacity-0 scale-75"
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transitionDelay: `${delay}ms`,
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              <div
                className={`px-4 py-2 rounded-lg border transition-colors duration-200 ${
                  isCenter
                    ? "bg-accent-faint border-accent-light text-ink font-medium text-sm"
                    : "bg-surface-raised border-stone-200 text-ink-muted text-xs"
                } ${hoveredNode === node.id ? "border-accent" : ""}`}
              >
                {node.label}
              </div>
            </div>
          );
        })}

        {/* Hover description */}
        {hoveredDesc && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full mt-4 max-w-sm text-center text-sm text-ink-muted font-mono px-4 py-2">
            {hoveredDesc}
          </div>
        )}
      </div>
    </div>
  );
}
