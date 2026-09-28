import { describe, expect, it } from 'vitest';
import {
  type Action,
  applyAction,
  compileStory,
  createGame,
  EngineError,
  type EngineEvent,
  encounterActions,
  evaluateInState,
  type GameState,
  getView,
  StorySchema,
} from '../src';
import { lighthouse, lighthouseInput } from './fixtures/lighthouse';

const story = compileStory(lighthouse);

function play(seed: number, actions: Action[]) {
  let { state, events } = createGame(story, seed);
  const all: EngineEvent[] = [...events];
  for (const action of actions) {
    ({ state, events } = applyAction(story, state, action));
    all.push(...events);
  }
  return { state, events: all };
}

/** Cherche une graine produisant l'issue voulue (le moteur est déterministe). */
function findSeed(predicate: (seed: number) => boolean): number {
  for (let seed = 1; seed < 5_000; seed++) if (predicate(seed)) return seed;
  throw new Error('aucune graine trouvée');
}

const choose = (choice: string): Action => ({ type: 'choose', choice });

describe('createGame', () => {
  it('initialise les variables et entre dans le passage de départ', () => {
    const { state, events } = createGame(story, 42);
    expect(state.passage).toBe('debut');
    expect(state.vars).toMatchObject({ habilete: 9, endurance: 12, nom: 'Élise', alerte: false });
    expect(state.visits).toEqual({ debut: 1 });
    expect(state.path).toEqual(['debut']);
    expect(state.step).toBe(0);
    expect(events).toEqual([{ type: 'passage:entered', passage: 'debut' }]);
  });

  it('est pur : l’état précédent n’est jamais muté', () => {
    const { state } = createGame(story, 1);
    const snapshot = JSON.stringify(state);
    applyAction(story, state, choose('fouiller'));
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});

describe('choix', () => {
  it('applique les effets et respecte les choix à usage unique', () => {
    const { state, events } = play(1, [choose('fouiller')]);
    expect(state.inventory).toEqual({ piece: 2, lanterne: 1 });
    expect(events).toContainEqual({ type: 'item:gained', item: 'piece', qty: 2 });
    const view = getView(story, state);
    expect(view.choices.map((choice) => choice.id)).toEqual(['entrer', 'fuir']);
    expect(() => applyAction(story, state, choose('fouiller'))).toThrow(EngineError);
  });

  it('affiche les choix verrouillés avec un indice, ou les masque', () => {
    const { state } = play(1, [choose('entrer')]);
    const view = getView(story, state);
    const monter = view.choices.find((choice) => choice.id === 'monter');
    expect(monter).toMatchObject({ available: false, hint: 'Il fait trop sombre.' });
    expect(view.choices.some((choice) => choice.id === 'secret')).toBe(false);
    expect(() => applyAction(story, state, choose('monter'))).toThrow(/indisponible/);
  });

  it('rend le texte conditionnel selon l’état', () => {
    const dark = play(1, [choose('entrer')]).state;
    expect(getView(story, dark).passage.plainText).toBe('Il fait noir.');
    const lit = play(1, [choose('fouiller'), choose('entrer')]).state;
    expect(getView(story, lit).passage.plainText).toBe('La lanterne révèle un escalier.');
    const start = play(1, [choose('fouiller')]).state;
    expect(getView(story, start).passage.plainText).toContain('Vos poches tintent de 2 pièces.');
  });

  it('refuse un choix inconnu', () => {
    const { state } = createGame(story, 1);
    expect(() => applyAction(story, state, choose('nimporte'))).toThrow(EngineError);
  });
});

describe('épreuves', () => {
  const attempt = (seed: number) => play(seed, [choose('entrer'), choose('forcer')]);

  it('réussite : jet ≤ habileté mène à la cave avec la clé', () => {
    const seed = findSeed((s) => attempt(s).state.passage === 'cave');
    const { state, events } = attempt(seed);
    const roll = events.find((event) => event.type === 'dice:rolled');
    expect(roll).toMatchObject({
      success: true,
      target: 9,
      compare: 'lte',
      label: 'Épreuve d’habileté',
    });
    if (roll?.type === 'dice:rolled') {
      expect(roll.rolls).toHaveLength(2);
      expect(roll.total).toBeLessThanOrEqual(9);
    }
    expect(state.inventory.cle).toBe(1);
    expect(state.vars.alerte).toBe(true);
    expect(state.achievements).toContain('curieux');
    expect(events).toContainEqual({ type: 'test:resolved', success: true, text: 'La porte cède.' });
  });

  it('échec : blessure et perte d’endurance', () => {
    const seed = findSeed((s) => attempt(s).state.passage === 'blessure');
    const { state } = attempt(seed);
    expect(state.vars.endurance).toBe(10);
    expect(getView(story, state).passage.plainText).toBe(
      'Vous vous écorchez les mains. Endurance : 10.',
    );
  });

  it('est déterministe pour une graine donnée', () => {
    expect(attempt(123)).toEqual(attempt(123));
  });
});

describe('règles globales', () => {
  it('redirigent vers la mort quand l’endurance tombe à zéro', () => {
    const fragile = compileStory(
      StorySchema.parse({
        ...lighthouseInput,
        variables: lighthouseInput.variables?.map((variable) =>
          variable.id === 'endurance' ? { ...variable, initial: 2 } : variable,
        ),
      }),
    );
    let state: GameState | null = null;
    for (let seed = 1; seed < 5_000 && !state; seed++) {
      let current = createGame(fragile, seed).state;
      current = applyAction(fragile, current, choose('entrer')).state;
      const result = applyAction(fragile, current, choose('forcer'));
      if (result.events.some((event) => event.type === 'rule:triggered')) state = result.state;
    }
    expect(state?.passage).toBe('mort');
    expect(state?.status).toBe('ended');
    expect(state?.ending).toEqual({
      passage: 'mort',
      kind: 'death',
      title: 'Emportée par la brume',
    });
    expect(state?.firedRules).toEqual(['mort-endurance']);
  });

  it('détectent les boucles de redirection', () => {
    const loop = compileStory(
      StorySchema.parse({
        title: 'Boucle',
        start: 'a',
        rules: [
          { id: 'r1', when: 'true', goto: 'b', once: false },
          { id: 'r2', when: 'true', goto: 'a', once: false },
        ],
        passages: [
          { id: 'a', title: 'A', text: 'a', choices: [{ id: 'x', text: 'x', to: 'b' }] },
          { id: 'b', title: 'B', text: 'b', choices: [{ id: 'y', text: 'y', to: 'a' }] },
        ],
      }),
    );
    expect(() => createGame(loop, 1)).toThrow(/boucle/);
  });
});

describe('combat', () => {
  const toStairs = [choose('fouiller'), choose('entrer'), choose('monter')];

  it('démarre un combat à l’entrée du passage', () => {
    const { state, events } = play(7, toStairs);
    expect(state.encounter).toMatchObject({ current: 0, round: 0 });
    expect(events).toContainEqual({ type: 'combat:started', enemies: ['gardien'] });
    expect(state.vars.courage).toBe(1);
    const view = getView(story, state);
    expect(view.choices).toHaveLength(0);
    expect(view.stuck).toBe(false);
    expect(view.encounter?.enemies[0]).toMatchObject({ name: 'Gardien de pierre', active: true });
    expect(view.encounter?.canFlee).toBe(false);
    expect(encounterActions(story, state)).toEqual({ attack: true, flee: false });
    expect(() => applyAction(story, state, choose('x'))).toThrow(/combat/);
    expect(() => applyAction(story, state, { type: 'flee' })).toThrow(/fuite/);
  });

  it('se résout par la victoire (succès débloqué)', () => {
    let { state } = play(7, toStairs);
    const events: EngineEvent[] = [];
    for (let round = 0; round < 50 && state.encounter; round++) {
      const result = applyAction(story, state, { type: 'attack' });
      state = result.state;
      events.push(...result.events);
    }
    expect(state.passage).toBe('sommet');
    expect(state.status).toBe('ended');
    expect(state.achievements).toContain('brave');
    expect(events.filter((event) => event.type === 'combat:round').length).toBeGreaterThan(1);
    expect(events).toContainEqual({ type: 'combat:ended', outcome: 'victory' });
    expect(() => applyAction(story, state, { type: 'attack' })).toThrow(/terminée/);
  });

  it('permet la fuite après le premier assaut, au prix d’endurance', () => {
    let { state } = play(7, toStairs);
    state = applyAction(story, state, { type: 'attack' }).state;
    const before = Number(state.vars.endurance);
    const fled = applyAction(story, state, { type: 'flee' });
    expect(fled.state.passage).toBe('hall');
    expect(fled.state.vars.endurance).toBe(before - 2);
    expect(fled.events).toContainEqual({ type: 'combat:ended', outcome: 'fled' });
  });

  it('refuse d’attaquer hors combat', () => {
    const { state } = createGame(story, 1);
    expect(() => applyAction(story, state, { type: 'attack' })).toThrow(/combat/);
  });
});

describe('vue et variables', () => {
  it('borne les variables numériques', () => {
    const bounded = compileStory(
      StorySchema.parse({
        title: 'Bornes',
        start: 's',
        variables: [
          { id: 'pv', name: 'PV', type: 'number', initial: 5, min: 0, max: 10 },
          { id: 'ok', name: 'OK', type: 'boolean', initial: false },
          { id: 'titre', name: 'Titre', type: 'text', initial: 'Page' },
        ],
        passages: [
          {
            id: 's',
            title: 'S',
            text: '{{pv}}',
            choices: [
              {
                id: 'soin',
                text: 'Soin',
                to: 'e',
                effects: [
                  { kind: 'add', var: 'pv', value: '100' },
                  { kind: 'set', var: 'ok', value: '1' },
                  { kind: 'add', var: 'titre', value: '" 2"' },
                ],
              },
            ],
          },
          { id: 'e', title: 'E', text: 'fin', ending: { kind: 'victory', title: 'Fin' } },
        ],
      }),
    );
    const { state } = applyAction(bounded, createGame(bounded, 1).state, choose('soin'));
    expect(state.vars).toEqual({ pv: 10, ok: true, titre: 'Page 2' });
    expect(evaluateInState(bounded, state, 'pv * 2')).toBe(20);
  });

  it('expose statistiques visibles et inventaire hors objets cachés', () => {
    const { state } = play(1, [choose('fouiller')]);
    const view = getView(story, state);
    expect(view.stats.map((stat) => stat.id)).toEqual(['habilete', 'endurance', 'chance']);
    expect(view.inventory).toEqual([
      { id: 'piece', name: "Pièce d'or", description: null, icon: null, qty: 2 },
      { id: 'lanterne', name: 'Lanterne', description: null, icon: null, qty: 1 },
    ]);
  });

  it('marque un passage sans issue', () => {
    const stuck = compileStory(
      StorySchema.parse({
        title: 'Impasse',
        start: 'a',
        passages: [
          {
            id: 'a',
            title: 'A',
            text: 'Rien.',
            choices: [{ id: 'x', text: 'x', to: 'a', condition: 'false' }],
          },
        ],
      }),
    );
    expect(getView(stuck, createGame(stuck, 1).state).stuck).toBe(true);
  });
});
