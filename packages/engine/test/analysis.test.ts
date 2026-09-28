import { describe, expect, it } from 'vitest';
import {
  analyzeStory,
  buildGraph,
  compileStory,
  computeStoryStats,
  countWords,
  depths,
  difficultyFromFailureRate,
  type StoryInput,
  StorySchema,
  simulate,
} from '../src';
import { lighthouse } from './fixtures/lighthouse';

const codes = (input: StoryInput) =>
  analyzeStory(StorySchema.parse(input)).diagnostics.map((diagnostic) => diagnostic.code);

describe('analyzeStory', () => {
  it('ne signale rien de bloquant sur un récit sain', () => {
    const report = analyzeStory(lighthouse);
    expect(report.errors).toBe(0);
    expect(report.publishable).toBe(true);
    expect(report.diagnostics.filter((d) => d.severity === 'warning')).toEqual([]);
  });

  it('détecte liens cassés, impasses, orphelins et absence de fin', () => {
    const found = codes({
      title: 'Cassé',
      start: 'a',
      passages: [
        {
          id: 'a',
          title: 'A',
          text: 'Texte',
          choices: [
            { id: 'c', text: 'Vers X', to: 'x' },
            { id: 'd', text: 'B', to: 'b' },
          ],
        },
        { id: 'b', title: 'B', text: 'Impasse' },
        { id: 'orphelin', title: 'Orphelin', text: '' },
      ],
    });
    expect(found).toEqual(
      expect.arrayContaining([
        'broken_link',
        'dead_end',
        'unreachable_passage',
        'no_ending',
        'empty_passage',
      ]),
    );
  });

  it('détecte départ manquant et identifiants dupliqués', () => {
    expect(
      codes({
        title: 'Doublons',
        start: 'z',
        passages: [
          { id: 'a', title: 'A', text: 'x', ending: { kind: 'neutral', title: 'Fin' } },
          { id: 'a', title: 'A bis', text: 'y', ending: { kind: 'neutral', title: 'Fin' } },
        ],
      }),
    ).toEqual(expect.arrayContaining(['start_missing', 'duplicate_id']));
  });

  it('vérifie expressions, références, types et balisage', () => {
    const found = codes({
      title: 'Expressions',
      start: 'a',
      variables: [
        { id: 'pv', name: 'PV', type: 'number', initial: 3 },
        { id: 'ok', name: 'OK', type: 'boolean', initial: false },
      ],
      items: [{ id: 'epee', name: 'Épée' }],
      passages: [
        {
          id: 'a',
          title: 'A',
          text: '{{#if magie > 1}}x{{/if}} {{#if pv >}}',
          onEnter: [
            { kind: 'add', var: 'ok', value: '1' },
            { kind: 'set', var: 'pv', value: '"texte"' },
            { kind: 'give', item: 'bouclier' },
            { kind: 'unlock', achievement: 'rien' },
            { kind: 'set', var: 'inconnue', value: '1' },
          ],
          choices: [
            { id: 'c1', text: 'Un', to: 'fin', condition: 'pv +' },
            { id: 'c2', text: 'Deux', to: 'fin', condition: 'pv + 1' },
            {
              id: 'c3',
              text: 'Trois',
              test: {
                dice: '99d6',
                compare: 'gte',
                target: 'force',
                success: { to: 'fin' },
                failure: { to: 'nulle-part' },
              },
            },
          ],
        },
        { id: 'fin', title: 'Fin', text: 'Fin', ending: { kind: 'victory', title: 'Fin' } },
      ],
    });
    expect(found).toEqual(
      expect.arrayContaining([
        'unknown_reference',
        'markup_error',
        'type_mismatch',
        'invalid_expression',
        'invalid_dice',
        'broken_link',
        'unused_item',
      ]),
    );
  });

  it('repère les pièges sans issue et les combats mal configurés', () => {
    const found = codes({
      title: 'Pièges',
      start: 'a',
      variables: [{ id: 'nom', name: 'Nom', type: 'text', initial: 'x' }],
      passages: [
        {
          id: 'a',
          title: 'A',
          text: 'Départ',
          choices: [
            { id: 'boucle', text: 'Boucle', to: 'b' },
            { id: 'fin', text: 'Fin', to: 'f', condition: 'false' },
          ],
        },
        {
          id: 'b',
          title: 'B',
          text: 'Boucle',
          choices: [{ id: 'retour', text: 'Retour', to: 'c' }],
        },
        {
          id: 'c',
          title: 'C',
          text: 'Combat',
          choices: [{ id: 'z', text: 'z', to: 'b' }],
          encounter: {
            enemies: [{ id: 'loup', name: 'Loup', skill: 5, stamina: 5 }],
            skillVar: 'nom',
            staminaVar: 'absente',
            victory: { to: 'b' },
            defeat: { to: 'b' },
          },
        },
        {
          id: 'f',
          title: 'F',
          text: 'Fin',
          ending: { kind: 'victory', title: 'Fin' },
          choices: [{ id: 'q', text: 'q', to: 'a' }],
        },
      ],
    });
    expect(found).toEqual(
      expect.arrayContaining([
        'no_path_to_ending',
        'encounter_with_choices',
        'invalid_encounter_variable',
        'ending_with_choices',
      ]),
    );
  });

  it('prévient quand tous les choix sont conditionnels', () => {
    expect(
      codes({
        title: 'Conditions',
        start: 'a',
        passages: [
          {
            id: 'a',
            title: 'A',
            text: 'x',
            choices: [{ id: 'c', text: 'c', to: 'f', condition: 'true' }],
          },
          { id: 'f', title: 'F', text: 'y', ending: { kind: 'neutral', title: 'F' } },
        ],
      }),
    ).toContain('all_choices_conditional');
  });
});

describe('statistiques', () => {
  it('compte mots, fins et mécaniques', () => {
    const stats = computeStoryStats(lighthouse);
    expect(stats).toMatchObject({
      passages: 9,
      choices: 10,
      tests: 1,
      encounters: 1,
      variables: 6,
      items: 3,
      achievements: 2,
      endings: { total: 4, byKind: { victory: 1, secret: 1, death: 1, neutral: 1, defeat: 0 } },
    });
    expect(stats.words).toBeGreaterThan(50);
    expect(stats.maxDepth).toBe(3);
    expect(countWords("L'aube s’éveille — rendez-vous au 12.")).toBe(5);
  });

  it('construit le graphe et les profondeurs', () => {
    const graph = buildGraph(lighthouse);
    expect(graph.successors.get('hall')).toEqual(['escalier', 'cave', 'cave', 'blessure', 'debut']);
    expect(graph.predecessors.get('mort')).toEqual(expect.arrayContaining(['escalier', 'debut']));
    expect(depths(lighthouse).get('sommet')).toBe(3);
  });
});

describe('simulation', () => {
  it('estime difficulté, durée et couverture de façon reproductible', () => {
    const story = compileStory(lighthouse);
    const report = simulate(story, { runs: 200, seed: 3 });
    expect(report).toEqual(simulate(story, { runs: 200, seed: 3 }));
    expect(report.completed).toBe(200);
    expect(report.stuck + report.exhausted + report.errors).toBe(0);
    expect(report.coverage).toBeGreaterThan(0.7);
    expect(Object.values(report.endings).reduce((a, b) => a + b, 0)).toBe(200);
    expect(report.estimatedMinutes).toBeGreaterThanOrEqual(1);
    expect(['gentle', 'balanced', 'challenging', 'brutal']).toContain(report.difficulty);
  });

  it('détecte les parties bloquées ou infinies', () => {
    const story = compileStory(
      StorySchema.parse({
        title: 'Boucle',
        start: 'a',
        passages: [
          { id: 'a', title: 'A', text: 'x', choices: [{ id: 'b', text: 'b', to: 'b' }] },
          { id: 'b', title: 'B', text: 'y', choices: [{ id: 'a', text: 'a', to: 'a' }] },
        ],
      }),
    );
    expect(simulate(story, { runs: 5, maxSteps: 20 }).exhausted).toBe(5);
  });

  it('classe la difficulté', () => {
    expect(difficultyFromFailureRate(0.05)).toBe('gentle');
    expect(difficultyFromFailureRate(0.3)).toBe('balanced');
    expect(difficultyFromFailureRate(0.5)).toBe('challenging');
    expect(difficultyFromFailureRate(0.9)).toBe('brutal');
  });
});
