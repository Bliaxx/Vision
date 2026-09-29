'use client';

import { buildGraph, type EdgeKind } from '@dedale/engine';
import {
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  type Edge,
  MarkerType,
  MiniMap,
  type NodeChange,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useMemo, useState } from 'react';
import { useEditor } from './context';
import { PassageNode, type PassageNodeType } from './passage-node';

const nodeTypes = { passage: PassageNode };

const EDGE_STYLE: Record<EdgeKind, { stroke: string; dash?: string }> = {
  choice: { stroke: 'var(--dd-border-strong)' },
  success: { stroke: 'var(--dd-success)' },
  failure: { stroke: 'var(--dd-danger)', dash: '6 4' },
  victory: { stroke: 'var(--dd-success)' },
  defeat: { stroke: 'var(--dd-danger)', dash: '6 4' },
  flee: { stroke: 'var(--dd-warning)', dash: '2 4' },
  rule: { stroke: 'var(--dd-info)', dash: '2 4' },
};

/**
 * Toile de l'éditeur : chaque passage est un nœud, chaque choix une arête.
 * Relier deux nœuds crée un choix ; double-cliquer sur la toile crée un passage.
 */
export function GraphCanvas({ heat }: { heat: ReadonlyMap<string, number> | null }) {
  const doc = useEditor((state) => state.doc);
  const selectedId = useEditor((state) => state.selectedId);
  const analysis = useEditor((state) => state.analysis);
  const select = useEditor((state) => state.select);
  const update = useEditor((state) => state.update);
  const addChoice = useEditor((state) => state.addChoice);
  const addPassage = useEditor((state) => state.addPassage);
  const flow = useReactFlow();
  // Positions en cours de glissement : affichées sans polluer l'historique.
  const [dragging, setDragging] = useState<Record<string, { x: number; y: number }>>({});
  // Dimensions mesurées par React Flow (nécessaires à la mini-carte et au cadrage).
  const [measured, setMeasured] = useState<Record<string, { width: number; height: number }>>({});

  const severityByPassage = useMemo(() => {
    const map = new Map<string, 'error' | 'warning'>();
    for (const diagnostic of analysis.diagnostics) {
      if (!diagnostic.passage || diagnostic.severity === 'info') continue;
      if (map.get(diagnostic.passage) !== 'error') map.set(diagnostic.passage, diagnostic.severity);
    }
    return map;
  }, [analysis]);

  const maxHeat = heat ? Math.max(1, ...heat.values()) : 1;

  const nodes: PassageNodeType[] = doc.passages.map((passage) => ({
    id: passage.id,
    type: 'passage',
    position: dragging[passage.id] ?? passage.position ?? { x: 0, y: 0 },
    selected: passage.id === selectedId,
    ...(measured[passage.id] ? { measured: measured[passage.id] } : {}),
    data: {
      passage,
      isStart: passage.id === doc.start,
      severity: severityByPassage.get(passage.id) ?? null,
      heat: heat ? (heat.get(passage.id) ?? 0) / maxHeat : null,
    },
  }));

  const edges: Edge[] = useMemo(() => {
    const known = new Set(doc.passages.map((passage) => passage.id));
    const byChoice = new Map(
      doc.passages.flatMap((passage) =>
        passage.choices.map((choice) => [`${passage.id}/${choice.id}`, choice.text] as const),
      ),
    );
    return buildGraph(doc)
      .edges.filter((edge) => edge.kind !== 'rule' && known.has(edge.to))
      .map((edge, index) => {
        const style = EDGE_STYLE[edge.kind];
        const label = edge.choice ? byChoice.get(`${edge.from}/${edge.choice}`) : undefined;
        return {
          id: `${edge.from}-${edge.to}-${edge.choice ?? edge.kind}-${edge.kind}-${index}`,
          source: edge.from,
          target: edge.to,
          type: 'smoothstep',
          ...(label && edge.kind === 'choice'
            ? { label: label.length > 28 ? `${label.slice(0, 27)}…` : label }
            : {}),
          labelStyle: { fontSize: 11, fontWeight: 600, fill: 'var(--dd-text-muted)' },
          labelBgStyle: { fill: 'var(--dd-canvas)' },
          style: {
            stroke: style.stroke,
            strokeWidth: 1.8,
            ...(style.dash ? { strokeDasharray: style.dash } : {}),
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke, width: 16, height: 16 },
          animated: edge.from === selectedId,
        };
      });
  }, [doc, selectedId]);

  const onNodesChange = (changes: NodeChange<PassageNodeType>[]) => {
    for (const change of changes) {
      if (change.type === 'select' && change.selected) select(change.id);
      if (change.type === 'dimensions' && change.dimensions) {
        const dimensions = change.dimensions;
        setMeasured((current) => ({ ...current, [change.id]: dimensions }));
      }
      if (change.type === 'position' && change.position && change.dragging) {
        const position = change.position;
        setDragging((current) => ({ ...current, [change.id]: position }));
      }
    }
  };

  const onConnect = (connection: Connection) => {
    if (connection.source && connection.target) addChoice(connection.source, connection.target);
  };

  return (
    <ReactFlow<PassageNodeType, Edge>
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeDragStop={(_, node) => {
        update((draft) => {
          const passage = draft.passages.find((candidate) => candidate.id === node.id);
          if (passage)
            passage.position = { x: Math.round(node.position.x), y: Math.round(node.position.y) };
        });
        setDragging({});
      }}
      onConnect={onConnect}
      onPaneClick={() => select(null)}
      onDoubleClick={(event) => {
        if ((event.target as HTMLElement).closest('.react-flow__node')) return;
        addPassage(flow.screenToFlowPosition({ x: event.clientX, y: event.clientY }));
      }}
      zoomOnDoubleClick={false}
      fitView
      fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
      minZoom={0.15}
      proOptions={{ hideAttribution: true }}
      deleteKeyCode={null}
      className="bg-canvas"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={22}
        size={1.6}
        color="var(--dd-canvas-dot)"
      />
      <MiniMap
        pannable
        zoomable
        className="!rounded-lg !border !border-line !bg-surface"
        bgColor="var(--dd-surface)"
        maskColor="color-mix(in oklab, var(--dd-canvas) 70%, transparent)"
        nodeBorderRadius={8}
        nodeColor={(node) =>
          node.id === selectedId ? 'var(--dd-accent)' : 'var(--dd-border-strong)'
        }
      />
      <Controls
        className="!rounded-lg !border !border-line !shadow-paper"
        showInteractive={false}
      />
    </ReactFlow>
  );
}
