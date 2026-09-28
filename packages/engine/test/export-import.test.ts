import { describe, expect, it } from 'vitest';
import {
  analyzeStory,
  createId,
  diceDistribution,
  parseDice,
  parseStory,
  rollDice,
  seedRng,
  slugifyId,
} from '../src';
import { ENGLISH_LABELS, toGamebook } from '../src/export/gamebook';
import { importTwee, TweeImportError } from '../src/import/twee';
import { lighthouse } from './fixtures/lighthouse';

describe('toGamebook', () => {
  const book = toGamebook(lighthouse, { seed: 7 });

  it('numérote tous les passages, départ en 1', () => {
    expect(book.sections).toHaveLength(lighthouse.passages.length);
    expect(book.sections[0]).toMatchObject({ number: 1, passage: 'debut' });
    expect(new Set(book.sections.map((section) => section.number)).size).toBe(book.sections.length);
  });

  it('convertit choix, conditions, épreuves et combats en renvois', () => {
    const numberOf = (id: string) =>
      book.sections.find((section) => section.passage === id)?.number;
    const hall = book.sections.find((section) => section.passage === 'hall')?.markdown ?? '';
    expect(hall).toContain(`rendez-vous au **${numberOf('escalier')}**`);
    expect(hall).toContain('Si vous possédez : Lanterne');
    expect(hall).toContain('**Épreuve d’habileté** — lancez 2d6 : si le total est ≤ Habileté');
    const stairs = book.sections.find((section) => section.passage === 'escalier')?.markdown ?? '';
    expect(stairs).toContain('**Gardien de pierre** — Habileté 2, Endurance 4');
    expect(stairs).toContain('Vous pouvez prendre la fuite');
    expect(book.markdown).toContain("Feuille d'aventure");
    expect(book.markdown).toContain('**FIN** — *Le phare rallumé*');
  });

  it('est stable pour une graine et peut être localisé', () => {
    expect(toGamebook(lighthouse, { seed: 7 })).toEqual(book);
    expect(toGamebook(lighthouse, { labels: ENGLISH_LABELS }).markdown).toContain('turn to');
  });
});

describe('importTwee', () => {
  const twee = `:: StoryTitle
La Forêt

:: StoryData
{ "ifid": "ABC", "format": "Harlowe", "start": "Orée" }

:: Orée [debut] {"position":"100,200"}
Deux sentiers s'ouvrent devant vous.
[[Prendre à gauche->Clairière]]
[[Rivière<-Suivre l'eau]]
[[Grotte]]

:: Clairière
Le soleil perce. (set: $calme to true)
[[Revenir|Orée]]

:: Rivière
Vous vous noyez.

:: Grotte
Une ombre. [[Fuir->Nulle part]]

:: Styles [stylesheet]
body { color: red; }
`;

  it('convertit passages, liens et fins', () => {
    const { story, warnings } = importTwee(twee);
    expect(story.title).toBe('La Forêt');
    expect(story.start).toBe('oree');
    expect(story.passages.map((passage) => passage.id)).toEqual([
      'oree',
      'clairiere',
      'riviere',
      'grotte',
    ]);
    const start = story.passages[0];
    expect(start?.choices.map((choice) => [choice.text, choice.to])).toEqual([
      ['Prendre à gauche', 'clairiere'],
      ["Suivre l'eau", 'riviere'],
      ['Grotte', 'grotte'],
    ]);
    expect(start?.text).toBe("Deux sentiers s'ouvrent devant vous.");
    expect(start?.position).toEqual({ x: 100, y: 200 });
    expect(story.passages[2]?.ending).toEqual({ kind: 'neutral', title: 'Rivière' });
    expect(warnings.map((warning) => warning.message)).toEqual(
      expect.arrayContaining([
        "format d'origine : Harlowe",
        'passage technique ignoré',
        'lien cassé vers « Nulle part »',
        'macros Twine conservées en texte : à convertir en conditions/effets',
      ]),
    );
    expect(analyzeStory(story).errors).toBe(0);
  });

  it('refuse un fichier sans passage jouable', () => {
    expect(() => importTwee(':: StoryTitle\nVide')).toThrow(TweeImportError);
  });
});

describe('utilitaires', () => {
  it('valide un document de récit non fiable', () => {
    expect(parseStory({ title: 'x' })).toMatchObject({ success: false });
    const parsed = parseStory({
      title: 'Min',
      start: 'a',
      passages: [{ id: 'a', title: 'A', ending: { kind: 'neutral', title: 'Fin' } }],
    });
    expect(parsed.success && parsed.story.settings.rewind).toBe('free');
    expect(
      parseStory({
        ...lighthouse,
        variables: [{ id: 'x', name: 'X', type: 'number', initial: 'a' }],
      }),
    ).toMatchObject({ success: false });
    const reserved = parseStory({
      ...lighthouse,
      variables: [{ id: 'or', name: 'Or', type: 'number', initial: 0 }],
    });
    expect(reserved.success).toBe(false);
    if (!reserved.success) expect(reserved.issues[0]?.message).toContain('mot réservé');
  });

  it('génère des identifiants uniques et lisibles', () => {
    const existing = new Set(['p_aaaaaa']);
    let calls = 0;
    const id = createId('p', existing, () => (calls++ < 6 ? 0 : 0.5));
    expect(id).not.toBe('p_aaaaaa');
    expect(id).toMatch(/^p_[a-z0-9]{6}$/);
    expect(slugifyId('La Tour Noire !')).toBe('la-tour-noire');
    expect(slugifyId('123')).toBe('element-123');
  });

  it('lance des dés équitables et reproductibles', () => {
    expect(parseDice('2d6')).toEqual({ count: 2, sides: 6 });
    expect(parseDice(' 1 D 20 ')).toEqual({ count: 1, sides: 20 });
    expect(parseDice('0d6')).toBeNull();
    expect(parseDice('d6')).toBeNull();
    const spec = { count: 1, sides: 6 };
    let rng = seedRng(1);
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 6000; i++) {
      const [roll, next] = rollDice(rng, spec);
      rng = next;
      counts[(roll.total as number) - 1] = (counts[(roll.total as number) - 1] ?? 0) + 1;
    }
    for (const count of counts) expect(count).toBeGreaterThan(850);
    expect(rollDice(seedRng(5), { count: 2, sides: 6 })).toEqual(
      rollDice(seedRng(5), { count: 2, sides: 6 }),
    );
  });

  it('calcule la distribution exacte des jets', () => {
    const distribution = diceDistribution({ count: 2, sides: 6 });
    expect(distribution.get(7)).toBeCloseTo(6 / 36);
    expect([...distribution.values()].reduce((a, b) => a + b, 0)).toBeCloseTo(1);
  });
});
