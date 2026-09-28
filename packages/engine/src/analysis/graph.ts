import type { Passage, Story } from '../format/types';

export type EdgeKind = 'choice' | 'success' | 'failure' | 'victory' | 'defeat' | 'flee' | 'rule';

export interface StoryEdge {
  readonly from: string;
  readonly to: string;
  readonly kind: EdgeKind;
  /** Choix d'origine, le cas échéant. */
  readonly choice: string | null;
}

/** Arêtes sortantes d'un passage (sans tenir compte des conditions). */
export function outgoingEdges(passage: Passage): StoryEdge[] {
  const edges: StoryEdge[] = [];
  for (const choice of passage.choices) {
    if (choice.test) {
      edges.push({
        from: passage.id,
        to: choice.test.success.to,
        kind: 'success',
        choice: choice.id,
      });
      edges.push({
        from: passage.id,
        to: choice.test.failure.to,
        kind: 'failure',
        choice: choice.id,
      });
    } else if (choice.to) {
      edges.push({ from: passage.id, to: choice.to, kind: 'choice', choice: choice.id });
    }
  }
  if (passage.encounter) {
    const { victory, defeat, flee } = passage.encounter;
    edges.push({ from: passage.id, to: victory.to, kind: 'victory', choice: null });
    edges.push({ from: passage.id, to: defeat.to, kind: 'defeat', choice: null });
    if (flee) edges.push({ from: passage.id, to: flee.to, kind: 'flee', choice: null });
  }
  return edges;
}

export interface StoryGraph {
  readonly edges: readonly StoryEdge[];
  readonly successors: ReadonlyMap<string, readonly string[]>;
  readonly predecessors: ReadonlyMap<string, readonly string[]>;
}

/**
 * Graphe orienté du récit. Les règles globales peuvent se déclencher depuis
 * n'importe quel passage : on les modélise comme des arêtes depuis le départ
 * (sur-approximation suffisante pour l'accessibilité).
 */
export function buildGraph(story: Story): StoryGraph {
  const edges: StoryEdge[] = story.passages.flatMap(outgoingEdges);
  for (const rule of story.rules) {
    edges.push({ from: story.start, to: rule.goto, kind: 'rule', choice: null });
  }
  const successors = new Map<string, string[]>();
  const predecessors = new Map<string, string[]>();
  for (const passage of story.passages) {
    successors.set(passage.id, []);
    predecessors.set(passage.id, []);
  }
  for (const edge of edges) {
    successors.get(edge.from)?.push(edge.to);
    predecessors.get(edge.to)?.push(edge.from);
  }
  return { edges, successors, predecessors };
}

function traverse(start: Iterable<string>, next: ReadonlyMap<string, readonly string[]>) {
  const seen = new Set<string>();
  const queue = [...start].filter((id) => next.has(id));
  for (const id of queue) seen.add(id);
  while (queue.length > 0) {
    const id = queue.shift() as string;
    for (const neighbour of next.get(id) ?? []) {
      if (!seen.has(neighbour) && next.has(neighbour)) {
        seen.add(neighbour);
        queue.push(neighbour);
      }
    }
  }
  return seen;
}

/** Passages accessibles depuis le départ. */
export function reachableFromStart(story: Story, graph = buildGraph(story)): Set<string> {
  return traverse([story.start], graph.successors);
}

/** Passages depuis lesquels au moins une fin est atteignable. */
export function canReachEnding(story: Story, graph = buildGraph(story)): Set<string> {
  const endings = story.passages.filter((passage) => passage.ending).map((passage) => passage.id);
  return traverse(endings, graph.predecessors);
}

/** Profondeur (plus court chemin) de chaque passage depuis le départ. */
export function depths(story: Story, graph = buildGraph(story)): Map<string, number> {
  const depth = new Map<string, number>([[story.start, 0]]);
  const queue = [story.start];
  while (queue.length > 0) {
    const id = queue.shift() as string;
    const current = depth.get(id) ?? 0;
    for (const next of graph.successors.get(id) ?? []) {
      if (!depth.has(next)) {
        depth.set(next, current + 1);
        queue.push(next);
      }
    }
  }
  return depth;
}
