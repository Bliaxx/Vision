import { type StoryInput, StorySchema } from '../../src';

/** Récit de test couvrant toutes les mécaniques du moteur. */
export const lighthouseInput: StoryInput = {
  title: 'Le Phare',
  language: 'fr',
  start: 'debut',
  variables: [
    { id: 'habilete', name: 'Habileté', type: 'number', initial: 9, min: 0 },
    { id: 'endurance', name: 'Endurance', type: 'number', initial: 12, min: 0, max: 24 },
    { id: 'chance', name: 'Chance', type: 'number', initial: 8, min: 0 },
    { id: 'courage', name: 'Courage', type: 'number', initial: 0, visible: false },
    { id: 'nom', name: 'Nom', type: 'text', initial: 'Élise', visible: false },
    { id: 'alerte', name: 'Alerte', type: 'boolean', initial: false, visible: false },
  ],
  items: [
    { id: 'lanterne', name: 'Lanterne' },
    { id: 'cle', name: 'Clé rouillée' },
    { id: 'piece', name: "Pièce d'or", stackable: true },
  ],
  achievements: [
    { id: 'brave', name: 'Brave', description: 'Vaincre le gardien' },
    { id: 'curieux', name: 'Curieux', secret: true },
  ],
  rules: [{ id: 'mort-endurance', when: 'endurance <= 0', goto: 'mort' }],
  settings: { rewind: 'free', showChoiceStats: true, lockedChoices: 'show' },
  passages: [
    {
      id: 'debut',
      title: 'La lande',
      text: 'Vous êtes **{{nom}}**, gardienne sans phare.\n\nLe vent *hurle*. {{#if has piece}}Vos poches tintent de {{count(piece)}} pièces.{{/if}}',
      checkpoint: true,
      choices: [
        {
          id: 'fouiller',
          text: 'Fouiller la cabane',
          to: 'debut',
          once: true,
          effects: [
            { kind: 'give', item: 'piece', qty: 2 },
            { kind: 'give', item: 'lanterne' },
          ],
        },
        { id: 'entrer', text: 'Entrer dans le phare', to: 'hall' },
        { id: 'fuir', text: 'Rebrousser chemin', to: 'fuite' },
      ],
    },
    {
      id: 'hall',
      title: 'Le hall',
      text: '{{#if has lanterne}}La lanterne révèle un escalier.{{else if alerte}}Quelque chose bouge.{{else}}Il fait noir.{{/if}}',
      choices: [
        {
          id: 'monter',
          text: "Monter l'escalier",
          to: 'escalier',
          condition: 'has lanterne',
          lockedHint: 'Il fait trop sombre.',
        },
        {
          id: 'secret',
          text: 'Passage secret',
          to: 'cave',
          condition: 'unlocked curieux',
          locked: 'hide',
        },
        {
          id: 'forcer',
          text: 'Forcer la porte de la cave',
          test: {
            label: 'Épreuve d’habileté',
            dice: '2d6',
            compare: 'lte',
            target: 'habilete',
            success: {
              to: 'cave',
              effects: [{ kind: 'give', item: 'cle' }],
              text: 'La porte cède.',
            },
            failure: { to: 'blessure', effects: [{ kind: 'add', var: 'endurance', value: '-2' }] },
            effects: [{ kind: 'set', var: 'alerte', value: 'true' }],
          },
        },
        { id: 'sortir', text: 'Ressortir', to: 'debut' },
      ],
    },
    {
      id: 'blessure',
      title: 'Blessure',
      text: 'Vous vous écorchez les mains. Endurance : {{endurance}}.',
      choices: [{ id: 'retour', text: 'Revenir dans le hall', to: 'hall' }],
    },
    {
      id: 'escalier',
      title: "L'escalier",
      text: 'Un gardien de pierre vous barre la route.',
      onEnter: [{ kind: 'add', var: 'courage', value: '1' }],
      encounter: {
        enemies: [{ id: 'gardien', name: 'Gardien de pierre', skill: 2, stamina: 4 }],
        skillVar: 'habilete',
        staminaVar: 'endurance',
        victory: { to: 'sommet', effects: [{ kind: 'unlock', achievement: 'brave' }] },
        defeat: { to: 'mort' },
        flee: { to: 'hall', damage: 2, afterRound: 1 },
      },
    },
    {
      id: 'cave',
      title: 'La cave',
      text: 'Un coffre dort sous la poussière.',
      onEnter: [{ kind: 'unlock', achievement: 'curieux' }],
      choices: [
        { id: 'ouvrir', text: 'Ouvrir le coffre', to: 'tresor', condition: 'has cle' },
        { id: 'remonter', text: 'Remonter', to: 'hall' },
      ],
    },
    {
      id: 'sommet',
      title: 'Le sommet',
      text: 'La lumière renaît.',
      ending: { kind: 'victory', title: 'Le phare rallumé' },
    },
    {
      id: 'tresor',
      title: 'Le trésor',
      text: 'Des cartes marines oubliées.',
      ending: { kind: 'secret', title: 'Les cartes perdues' },
    },
    {
      id: 'mort',
      title: 'La fin',
      text: 'Le froid vous emporte.',
      ending: { kind: 'death', title: 'Emportée par la brume' },
    },
    {
      id: 'fuite',
      title: 'La fuite',
      text: 'Vous ne reviendrez jamais.',
      ending: { kind: 'neutral', title: 'Le renoncement' },
    },
  ],
};

export const lighthouse = StorySchema.parse(lighthouseInput);
