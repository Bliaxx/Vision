import type { EndingKind, Story } from '../format/types';
import { parseTemplate, templateToRawText } from '../markup/template';
import { buildGraph, depths } from './graph';

export interface StoryStats {
  readonly passages: number;
  readonly choices: number;
  readonly words: number;
  readonly endings: {
    readonly total: number;
    readonly byKind: Readonly<Record<EndingKind, number>>;
  };
  readonly tests: number;
  readonly encounters: number;
  readonly variables: number;
  readonly items: number;
  readonly achievements: number;
  /** Plus long des plus courts chemins depuis le départ. */
  readonly maxDepth: number;
  /** Nombre moyen de choix par passage non final. */
  readonly branching: number;
}

const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;

export function countWords(text: string): number {
  return text.match(WORD)?.length ?? 0;
}

/** Nombre de mots d'un texte balisé (toutes branches conditionnelles incluses). */
export function countMarkupWords(markup: string): number {
  return countWords(templateToRawText(parseTemplate(markup).nodes).replace(/[*#>]/g, ' '));
}

export function computeStoryStats(story: Story): StoryStats {
  const byKind: Record<EndingKind, number> = {
    victory: 0,
    defeat: 0,
    death: 0,
    neutral: 0,
    secret: 0,
  };
  let choices = 0;
  let words = 0;
  let tests = 0;
  let encounters = 0;
  let branchingPassages = 0;

  for (const passage of story.passages) {
    words += countMarkupWords(passage.text);
    choices += passage.choices.length;
    tests += passage.choices.filter((choice) => choice.test).length;
    if (passage.encounter) encounters++;
    if (passage.ending) byKind[passage.ending.kind]++;
    else branchingPassages++;
  }

  const depthByPassage = depths(story, buildGraph(story));
  const maxDepth = Math.max(0, ...depthByPassage.values());
  const endings = Object.values(byKind).reduce((sum, count) => sum + count, 0);

  return {
    passages: story.passages.length,
    choices,
    words,
    endings: { total: endings, byKind },
    tests,
    encounters,
    variables: story.variables.length,
    items: story.items.length,
    achievements: story.achievements.length,
    maxDepth,
    branching: branchingPassages === 0 ? 0 : Math.round((choices / branchingPassages) * 10) / 10,
  };
}
