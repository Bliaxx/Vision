import type { Expr } from '../expr/ast';
import { tryParseExpr } from '../expr/parser';
import { printExpr } from '../expr/printer';
import type { Compare, Effect, Passage, Story } from '../format/types';
import type { TemplateNode } from '../markup/template';
import { parseTemplate } from '../markup/template';
import { nextFloat, type RngState, seedRng } from '../runtime/rng';

/**
 * Export « livre-jeu papier » : les passages deviennent des paragraphes
 * numérotés et mélangés, les choix des renvois (« rendez-vous au 247 »), les
 * variables une feuille d'aventure. Base de l'offre d'impression à la demande.
 */
export interface GamebookSection {
  readonly number: number;
  readonly passage: string;
  readonly markdown: string;
}

export interface Gamebook {
  readonly title: string;
  readonly sections: readonly GamebookSection[];
  readonly adventureSheet: string;
  readonly markdown: string;
}

export interface GamebookLabels {
  readonly turnTo: (section: number) => string;
  readonly ifCondition: (condition: string) => string;
  readonly otherwise: string;
  readonly end: (title: string) => string;
  readonly adventureSheet: string;
  readonly inventory: string;
  readonly has: (item: string, qty: number) => string;
  readonly visited: (section: number) => string;
  readonly unlocked: (achievement: string) => string;
  readonly and: string;
  readonly or: string;
  readonly not: (text: string) => string;
  readonly compare: Readonly<Record<Compare, string>>;
  readonly test: (label: string, dice: string, compare: string, target: string) => string;
  readonly success: string;
  readonly failure: string;
  readonly combat: string;
  readonly enemyLine: (name: string, skill: number, stamina: number) => string;
  readonly victory: string;
  readonly defeat: string;
  readonly flee: (damage: number) => string;
  readonly effectAdd: (name: string, amount: string) => string;
  readonly effectSet: (name: string, value: string) => string;
  readonly effectGive: (item: string, qty: number) => string;
  readonly effectTake: (item: string, qty: number) => string;
  readonly effectUnlock: (achievement: string) => string;
}

export const FRENCH_LABELS: GamebookLabels = {
  turnTo: (n) => `rendez-vous au **${n}**`,
  ifCondition: (condition) => `Si ${condition}`,
  otherwise: 'Sinon',
  end: (title) => `**FIN** — *${title}*`,
  adventureSheet: "Feuille d'aventure",
  inventory: 'Équipement',
  has: (item, qty) =>
    qty > 1 ? `vous possédez au moins ${qty} × ${item}` : `vous possédez : ${item}`,
  visited: (n) => `vous avez déjà lu le paragraphe ${n}`,
  unlocked: (achievement) => `vous avez obtenu « ${achievement} »`,
  and: ' et ',
  or: ' ou ',
  not: (text) => `il est faux que ${text}`,
  compare: { lte: '≤', lt: '<', gte: '≥', gt: '>', eq: '=' },
  test: (label, dice, compare, target) =>
    `**${label}** — lancez ${dice} : si le total est ${compare} ${target}`,
  success: 'En cas de réussite',
  failure: "En cas d'échec",
  combat: 'Combat',
  enemyLine: (name, skill, stamina) => `**${name}** — Habileté ${skill}, Endurance ${stamina}`,
  victory: 'Si vous êtes vainqueur',
  defeat: 'Si vous êtes vaincu',
  flee: (damage) => `Vous pouvez prendre la fuite (−${damage} Endurance)`,
  effectAdd: (name, amount) =>
    amount.startsWith('-')
      ? `Retirez ${amount.slice(1)} à votre total de ${name}.`
      : `Ajoutez ${amount} à votre total de ${name}.`,
  effectSet: (name, value) => `Notez « ${name} = ${value} ».`,
  effectGive: (item, qty) =>
    qty > 1 ? `Vous obtenez ${qty} × ${item}.` : `Vous obtenez : ${item}.`,
  effectTake: (item, qty) => (qty > 1 ? `Rayez ${qty} × ${item}.` : `Rayez : ${item}.`),
  effectUnlock: (achievement) => `Succès débloqué : « ${achievement} ».`,
};

export const ENGLISH_LABELS: GamebookLabels = {
  turnTo: (n) => `turn to **${n}**`,
  ifCondition: (condition) => `If ${condition}`,
  otherwise: 'Otherwise',
  end: (title) => `**THE END** — *${title}*`,
  adventureSheet: 'Adventure Sheet',
  inventory: 'Equipment',
  has: (item, qty) => (qty > 1 ? `you have at least ${qty} × ${item}` : `you have: ${item}`),
  visited: (n) => `you have already read section ${n}`,
  unlocked: (achievement) => `you earned “${achievement}”`,
  and: ' and ',
  or: ' or ',
  not: (text) => `it is not true that ${text}`,
  compare: { lte: '≤', lt: '<', gte: '≥', gt: '>', eq: '=' },
  test: (label, dice, compare, target) =>
    `**${label}** — roll ${dice}: if the total is ${compare} ${target}`,
  success: 'On a success',
  failure: 'On a failure',
  combat: 'Combat',
  enemyLine: (name, skill, stamina) => `**${name}** — Skill ${skill}, Stamina ${stamina}`,
  victory: 'If you win',
  defeat: 'If you lose',
  flee: (damage) => `You may escape (−${damage} Stamina)`,
  effectAdd: (name, amount) =>
    amount.startsWith('-')
      ? `Subtract ${amount.slice(1)} from your ${name}.`
      : `Add ${amount} to your ${name}.`,
  effectSet: (name, value) => `Note “${name} = ${value}”.`,
  effectGive: (item, qty) => (qty > 1 ? `You gain ${qty} × ${item}.` : `You gain: ${item}.`),
  effectTake: (item, qty) => (qty > 1 ? `Cross out ${qty} × ${item}.` : `Cross out: ${item}.`),
  effectUnlock: (achievement) => `Achievement unlocked: “${achievement}”.`,
};

export interface GamebookOptions {
  readonly seed?: number;
  readonly labels?: GamebookLabels;
}

function shuffle<T>(values: readonly T[], seed: number): T[] {
  const result = [...values];
  let rng: RngState = seedRng(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const [value, next] = nextFloat(rng);
    rng = next;
    const j = Math.floor(value * (i + 1));
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

export function toGamebook(story: Story, options: GamebookOptions = {}): Gamebook {
  const labels =
    options.labels ?? (story.language.startsWith('fr') ? FRENCH_LABELS : ENGLISH_LABELS);
  const start = story.passages.find((passage) => passage.id === story.start);
  const others = story.passages.filter((passage) => passage.id !== story.start);
  const ordered = [...(start ? [start] : []), ...shuffle(others, options.seed ?? 42)];
  const numbers = new Map(ordered.map((passage, index) => [passage.id, index + 1]));
  const variableNames = new Map(story.variables.map((variable) => [variable.id, variable.name]));
  const itemNames = new Map(story.items.map((item) => [item.id, item.name]));
  const achievementNames = new Map(story.achievements.map((a) => [a.id, a.name]));
  const sectionOf = (id: string) => numbers.get(id) ?? 0;

  const describe = (expr: Expr): string => {
    switch (expr.t) {
      case 'has':
        return labels.has(itemNames.get(expr.item) ?? expr.item, expr.qty);
      case 'visited':
        return labels.visited(sectionOf(expr.passage));
      case 'unlocked':
        return labels.unlocked(achievementNames.get(expr.achievement) ?? expr.achievement);
      case 'var':
        return variableNames.get(expr.id) ?? expr.id;
      case 'not':
        return labels.not(describe(expr.e));
      case 'bin':
        if (expr.op === 'and') return `${describe(expr.l)}${labels.and}${describe(expr.r)}`;
        if (expr.op === 'or') return `${describe(expr.l)}${labels.or}${describe(expr.r)}`;
        return `${describe(expr.l)} ${expr.op} ${describe(expr.r)}`;
      default:
        return printExpr(expr);
    }
  };

  const describeSource = (source: string) => {
    const parsed = tryParseExpr(source);
    return parsed.ok ? describe(parsed.expr) : source;
  };

  const describeEffects = (effects: readonly Effect[]): string =>
    effects
      .map((effect) => {
        switch (effect.kind) {
          case 'add':
            return labels.effectAdd(variableNames.get(effect.var) ?? effect.var, effect.value);
          case 'set':
            return labels.effectSet(variableNames.get(effect.var) ?? effect.var, effect.value);
          case 'give':
            return labels.effectGive(itemNames.get(effect.item) ?? effect.item, effect.qty);
          case 'take':
            return labels.effectTake(itemNames.get(effect.item) ?? effect.item, effect.qty);
          case 'unlock':
            return labels.effectUnlock(
              achievementNames.get(effect.achievement) ?? effect.achievement,
            );
        }
        return '';
      })
      .join(' ');

  const renderTemplate = (nodes: readonly TemplateNode[]): string =>
    nodes
      .map((node) => {
        if (node.t === 'text') return node.v;
        if (node.t === 'interp') return `[${describeSource(node.source)}]`;
        const branches = node.branches
          .map(
            (branch) =>
              `*[${labels.ifCondition(describe(branch.cond))} :]* ${renderTemplate(branch.body)}`,
          )
          .join(' ');
        const otherwise = node.otherwise.length
          ? ` *[${labels.otherwise} :]* ${renderTemplate(node.otherwise)}`
          : '';
        return `${branches}${otherwise}`;
      })
      .join('');

  const renderPassage = (passage: Passage): string => {
    const lines: string[] = [renderTemplate(parseTemplate(passage.text).nodes).trim()];
    const onEnter = describeEffects(passage.onEnter);
    if (onEnter) lines.push(`*${onEnter}*`);
    if (passage.ending) {
      lines.push(labels.end(passage.ending.title));
      return lines.join('\n\n');
    }
    if (passage.encounter) {
      const { encounter } = passage;
      lines.push(
        `**${labels.combat}**\n\n${encounter.enemies
          .map((enemy) => `- ${labels.enemyLine(enemy.name, enemy.skill, enemy.stamina)}`)
          .join('\n')}`,
      );
      lines.push(`${labels.victory}, ${labels.turnTo(sectionOf(encounter.victory.to))}.`);
      lines.push(`${labels.defeat}, ${labels.turnTo(sectionOf(encounter.defeat.to))}.`);
      if (encounter.flee) {
        lines.push(
          `${labels.flee(encounter.flee.damage)} : ${labels.turnTo(sectionOf(encounter.flee.to))}.`,
        );
      }
    }
    for (const choice of passage.choices) {
      const effects = describeEffects(choice.effects);
      const prefix = choice.condition
        ? `${labels.ifCondition(describeSource(choice.condition))} — `
        : '';
      const text = renderTemplate(parseTemplate(choice.text).nodes).trim();
      if (choice.test) {
        const { test } = choice;
        const testLine = labels.test(
          test.label ?? text,
          test.dice,
          labels.compare[test.compare],
          describeSource(test.target),
        );
        const always = describeEffects(test.effects);
        lines.push(
          [
            `- ${prefix}${testLine}.`,
            `  ${labels.success} : ${describeEffects(test.success.effects)} ${labels.turnTo(sectionOf(test.success.to))}.`,
            `  ${labels.failure} : ${describeEffects(test.failure.effects)} ${labels.turnTo(sectionOf(test.failure.to))}.`,
            always ? `  *${always}*` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        );
      } else if (choice.to) {
        lines.push(
          `- ${prefix}${text}${effects ? ` *(${effects})*` : ''} : ${labels.turnTo(sectionOf(choice.to))}.`,
        );
      }
    }
    return lines.join('\n\n');
  };

  const sections = ordered.map((passage) => ({
    number: sectionOf(passage.id),
    passage: passage.id,
    markdown: `## ${sectionOf(passage.id)}\n\n${renderPassage(passage)}`,
  }));

  const sheet = [
    `## ${labels.adventureSheet}`,
    ...story.variables
      .filter((variable) => variable.visible)
      .map((variable) => `- **${variable.name}** : ${String(variable.initial)} → ______`),
    story.items.length ? `\n**${labels.inventory}** : ____________________` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    title: story.title,
    sections,
    adventureSheet: sheet,
    markdown: [`# ${story.title}`, sheet, ...sections.map((section) => section.markdown)].join(
      '\n\n---\n\n',
    ),
  };
}
