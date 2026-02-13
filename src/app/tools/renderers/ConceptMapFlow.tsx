"use client";

/**
 * ConceptMapFlow — React Flow + ELK powered concept map renderer.
 *
 * Auto-layouts nodes with ELK, supports pan/zoom/touch.
 * Falls back to simple circle layout if ELK fails.
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ReactFlow,
  type Node,
  type Edge,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ConceptMapProps } from "../definitions/concept-map";

// ---------------------------------------------------------------------------
// ELK layout (dynamic import for code-splitting)
// ---------------------------------------------------------------------------

interface LayoutResult {
  nodes: Node[];
  edges: Edge[];
}

async function layoutWithElk(
  inputNodes: ConceptMapProps["nodes"],
  inputEdges: ConceptMapProps["edges"],
  centerNode?: string
): Promise<LayoutResult> {
  // Use bundled version to avoid web-worker dependency (Cloudflare Workers compat)
  const ELK = (await import("elkjs/lib/elk.bundled.js")).default;
  const elk = new ELK();

  const graph = await elk.layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.spacing.nodeNode": "60",
      "elk.layered.spacing.nodeNodeBetweenLayers": "80",
    },
    children: inputNodes.map((n) => ({
      id: n.id,
      width: 160,
      height: 50,
    })),
    edges: inputEdges
      .filter(
        (e) =>
          inputNodes.some((n) => n.id === e.from) &&
          inputNodes.some((n) => n.id === e.to)
      )
      .map((e, i) => ({
        id: `e-${i}`,
        sources: [e.from],
        targets: [e.to],
      })),
  });

  const nodes: Node[] = (graph.children || []).map((child) => {
    const original = inputNodes.find((n) => n.id === child.id)!;
    return {
      id: child.id,
      position: { x: child.x || 0, y: child.y || 0 },
      data: {
        label: original.label,
        description: original.description,
        isCenter: child.id === centerNode,
      },
      type: "conceptNode",
    };
  });

  const edges: Edge[] = inputEdges
    .filter(
      (e) =>
        inputNodes.some((n) => n.id === e.from) &&
        inputNodes.some((n) => n.id === e.to)
    )
    .map((e, i) => ({
      id: `e-${i}`,
      source: e.from,
      target: e.to,
      label: e.label || undefined,
      markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
      style: { stroke: "#d6d3d1", strokeWidth: 1 },
      labelStyle: { fontSize: 10, fill: "#a8a29e" },
    }));

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Simple circle fallback layout (no ELK needed)
// ---------------------------------------------------------------------------

function circleLayout(
  inputNodes: ConceptMapProps["nodes"],
  inputEdges: ConceptMapProps["edges"],
  centerNode?: string
): LayoutResult {
  const center = centerNode || inputNodes[0]?.id;
  const others = inputNodes.filter((n) => n.id !== center);
  const radius = Math.max(180, 50 * others.length);
  const angleStep = (2 * Math.PI) / Math.max(others.length, 1);

  const nodes: Node[] = inputNodes.map((n, i) => {
    let x: number;
    let y: number;
    if (n.id === center) {
      x = 300;
      y = 250;
    } else {
      const idx = others.indexOf(n);
      const angle = angleStep * idx - Math.PI / 2;
      x = 300 + Math.cos(angle) * radius;
      y = 250 + Math.sin(angle) * radius;
    }
    return {
      id: n.id,
      position: { x, y },
      data: { label: n.label, description: n.description, isCenter: n.id === center },
      type: "conceptNode",
    };
  });

  const edges: Edge[] = inputEdges
    .filter(
      (e) =>
        inputNodes.some((n) => n.id === e.from) &&
        inputNodes.some((n) => n.id === e.to)
    )
    .map((e, i) => ({
      id: `e-${i}`,
      source: e.from,
      target: e.to,
      label: e.label || undefined,
      markerEnd: { type: MarkerType.ArrowClosed, width: 12, height: 12 },
      style: { stroke: "#d6d3d1", strokeWidth: 1 },
      labelStyle: { fontSize: 10, fill: "#a8a29e" },
    }));

  return { nodes, edges };
}

// ---------------------------------------------------------------------------
// Custom node component
// ---------------------------------------------------------------------------

function ConceptNode({ data }: { data: { label: string; description?: string; isCenter: boolean } }) {
  const [showDesc, setShowDesc] = useState(false);

  return (
    <div
      className={`px-4 py-2.5 rounded-lg border transition-all duration-200 max-w-[160px] ${
        data.isCenter
          ? "bg-accent-faint border-accent-light text-ink font-medium text-sm"
          : "bg-surface-raised border-stone-200 text-ink-muted text-xs hover:border-accent/40"
      }`}
      onMouseEnter={() => data.description && setShowDesc(true)}
      onMouseLeave={() => setShowDesc(false)}
    >
      <div className="text-center leading-snug">{data.label}</div>
      {showDesc && data.description && (
        <div className="mt-1.5 pt-1.5 border-t border-stone-100 text-[10px] text-ink-faint leading-snug">
          {data.description}
        </div>
      )}
    </div>
  );
}

const nodeTypes = { conceptNode: ConceptNode };

// ---------------------------------------------------------------------------
// Inner flow (needs ReactFlowProvider above it)
// ---------------------------------------------------------------------------

function FlowInner({
  inputNodes,
  inputEdges,
  centerNode,
  onReady,
}: {
  inputNodes: ConceptMapProps["nodes"];
  inputEdges: ConceptMapProps["edges"];
  centerNode?: string;
  onReady?: () => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutDone, setLayoutDone] = useState(false);
  const { fitView } = useReactFlow();

  useEffect(() => {
    let cancelled = false;

    // Try ELK first, fallback to circle layout
    layoutWithElk(inputNodes, inputEdges, centerNode)
      .then((result) => {
        if (cancelled) return;
        setNodes(result.nodes);
        setEdges(result.edges);
        setLayoutDone(true);
      })
      .catch(() => {
        if (cancelled) return;
        const result = circleLayout(inputNodes, inputEdges, centerNode);
        setNodes(result.nodes);
        setEdges(result.edges);
        setLayoutDone(true);
      });

    return () => {
      cancelled = true;
    };
  }, [inputNodes, inputEdges, centerNode]);

  // Fit view after layout + brief delay for React Flow to render
  useEffect(() => {
    if (layoutDone && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
        onReady?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [layoutDone, nodes.length, fitView, onReady]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.3}
      maxZoom={2}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e7e5e4" gap={20} size={1} />
    </ReactFlow>
  );
}

// ---------------------------------------------------------------------------
// ConceptMapFlow — main export
// ---------------------------------------------------------------------------

interface Props {
  props: unknown;
  onReady?: () => void;
}

export default function ConceptMapFlow({ props, onReady }: Props) {
  const { nodes, edges, centerNode } = props as ConceptMapProps;

  return (
    <div className="h-full w-full" style={{ minHeight: 300 }}>
      <ReactFlowProvider>
        <FlowInner
          inputNodes={nodes}
          inputEdges={edges}
          centerNode={centerNode}
          onReady={onReady}
        />
      </ReactFlowProvider>
    </div>
  );
}
