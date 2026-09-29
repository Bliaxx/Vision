import { Graph, layout } from '@dagrejs/dagre';
import { buildGraph, type Story } from '@dedale/engine';

export interface NodeBox {
  readonly width: number;
  readonly height: number;
}

/**
 * Disposition hiérarchique du graphe d'un récit (départ en haut, fins en bas).
 * Partagée par le fil d'Ariane de la liseuse et la réorganisation de l'éditeur.
 */
export function layoutStory(
  story: Story,
  box: NodeBox = { width: 240, height: 110 },
  spacing = { nodes: 48, ranks: 90 },
): Map<string, { x: number; y: number }> {
  const graph = new Graph();
  graph.setGraph({
    rankdir: 'TB',
    nodesep: spacing.nodes,
    ranksep: spacing.ranks,
    marginx: 20,
    marginy: 20,
  });
  graph.setDefaultEdgeLabel(() => ({}));
  for (const passage of story.passages)
    graph.setNode(passage.id, { width: box.width, height: box.height });
  const edges = buildGraph(story).edges.filter((edge) => edge.kind !== 'rule');
  const seen = new Set<string>();
  for (const edge of edges) {
    const key = `${edge.from}->${edge.to}`;
    if (seen.has(key) || edge.from === edge.to || !graph.hasNode(edge.to)) continue;
    seen.add(key);
    graph.setEdge(edge.from, edge.to);
  }
  layout(graph);
  const positions = new Map<string, { x: number; y: number }>();
  const targets = new Set([...seen].map((key) => key.split('->')[1]));
  // Passages sans lien entrant (atteints par une règle globale, ou pas encore
  // reliés) : dagre les mettrait en haut ; on les range sur une rangée finale.
  const orphans: string[] = [];
  let bottom = 0;
  let left = Number.POSITIVE_INFINITY;
  for (const passage of story.passages) {
    const node = graph.node(passage.id);
    // dagre donne le centre ; React Flow et le SVG utilisent le coin supérieur gauche.
    const position = {
      x: Math.round(node.x - box.width / 2),
      y: Math.round(node.y - box.height / 2),
    };
    if (passage.id !== story.start && !targets.has(passage.id)) {
      orphans.push(passage.id);
      continue;
    }
    positions.set(passage.id, position);
    bottom = Math.max(bottom, position.y);
    left = Math.min(left, position.x);
  }
  orphans.forEach((id, index) => {
    positions.set(id, {
      x: (Number.isFinite(left) ? left : 20) + index * (box.width + spacing.nodes),
      y: bottom + box.height + spacing.ranks,
    });
  });
  return positions;
}
