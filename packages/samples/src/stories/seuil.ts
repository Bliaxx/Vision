import type { StoryInput } from '@dedale/engine';

/** Micro-récit jouable sur la page d'accueil (sans compte, sans réseau). */
export const seuilFr: StoryInput = {
  title: 'Le Seuil',
  language: 'fr',
  start: 'porte',
  variables: [{ id: 'chance', name: 'Chance', type: 'number', initial: 8, min: 0, icon: 'clover' }],
  items: [{ id: 'fil', name: 'Pelote de fil rouge', icon: 'spiral' }],
  settings: { rewind: 'free', showChoiceStats: false, lockedChoices: 'show' },
  passages: [
    {
      id: 'porte',
      title: 'Le seuil',
      text: "Devant vous, l'entrée d'un labyrinthe de pierre. À vos pieds, une **pelote de fil rouge**, abandonnée par quelqu'un qui n'est jamais revenu.",
      choices: [
        {
          id: 'fil',
          text: 'Nouer le fil à l’entrée et avancer',
          to: 'couloirs',
          effects: [{ kind: 'give', item: 'fil', qty: 1 }],
        },
        { id: 'seul', text: 'Avancer sans rien', to: 'couloirs' },
      ],
    },
    {
      id: 'couloirs',
      title: 'Les couloirs',
      text: 'Les couloirs se divisent, se rejoignent, se divisent encore. {{#if has fil}}Derrière vous, le fil rouge se déroule, rassurant.{{else}}Vous avez déjà oublié par où vous êtes venu.{{/if}}\n\nUn souffle chaud passe dans votre nuque.',
      choices: [
        {
          id: 'courir',
          text: 'Courir vers la lumière',
          test: {
            label: 'Tentez votre chance',
            dice: '2d6',
            compare: 'lte',
            target: 'chance',
            success: { to: 'coeur', text: 'Vous échappez de justesse à la créature.' },
            failure: { to: 'perdu', text: 'La lumière n’était qu’un reflet.' },
          },
        },
        {
          id: 'revenir',
          text: 'Suivre le fil pour ressortir',
          to: 'dehors',
          condition: 'has fil',
          lockedHint: 'Sans fil, impossible de retrouver la sortie.',
        },
      ],
    },
    {
      id: 'coeur',
      title: 'Le cœur',
      text: 'Au centre du labyrinthe, un jardin baigné de soleil. Vous comprenez : chaque histoire a son cœur, et vous venez de trouver celui-ci.',
      ending: { kind: 'victory', title: 'Le cœur du labyrinthe' },
    },
    {
      id: 'perdu',
      title: 'Perdu',
      text: 'Les murs se ressemblent tous. Quelque part, quelque chose respire. Il faudra recommencer — et cette fois, choisir autrement.',
      ending: { kind: 'defeat', title: 'Perdu dans les couloirs' },
    },
    {
      id: 'dehors',
      title: 'Dehors',
      text: 'Le fil vous ramène à l’air libre. Vous n’avez pas vu le cœur du labyrinthe… mais vous êtes vivant, et libre d’y revenir.',
      ending: { kind: 'neutral', title: 'Le chemin du retour' },
    },
  ],
};

export const seuilEn: StoryInput = {
  title: 'The Threshold',
  language: 'en',
  start: 'door',
  variables: [{ id: 'luck', name: 'Luck', type: 'number', initial: 8, min: 0, icon: 'clover' }],
  items: [{ id: 'thread', name: 'Ball of red thread', icon: 'spiral' }],
  settings: { rewind: 'free', showChoiceStats: false, lockedChoices: 'show' },
  passages: [
    {
      id: 'door',
      title: 'The threshold',
      text: 'Before you lies the entrance to a stone labyrinth. At your feet, a **ball of red thread**, left by someone who never came back.',
      choices: [
        {
          id: 'thread',
          text: 'Tie the thread at the entrance and go in',
          to: 'halls',
          effects: [{ kind: 'give', item: 'thread', qty: 1 }],
        },
        { id: 'alone', text: 'Go in empty-handed', to: 'halls' },
      ],
    },
    {
      id: 'halls',
      title: 'The halls',
      text: 'Corridors split, merge, and split again. {{#if has thread}}Behind you, the red thread unwinds, reassuring.{{else}}You have already forgotten the way back.{{/if}}\n\nA warm breath brushes the back of your neck.',
      choices: [
        {
          id: 'run',
          text: 'Run toward the light',
          test: {
            label: 'Test your luck',
            dice: '2d6',
            compare: 'lte',
            target: 'luck',
            success: { to: 'heart', text: 'You narrowly escape the creature.' },
            failure: { to: 'lost', text: 'The light was only a reflection.' },
          },
        },
        {
          id: 'back',
          text: 'Follow the thread back out',
          to: 'outside',
          condition: 'has thread',
          lockedHint: 'Without a thread, there is no way back.',
        },
      ],
    },
    {
      id: 'heart',
      title: 'The heart',
      text: 'At the centre of the labyrinth lies a sunlit garden. You understand: every story has a heart, and you just found this one.',
      ending: { kind: 'victory', title: 'The heart of the labyrinth' },
    },
    {
      id: 'lost',
      title: 'Lost',
      text: 'Every wall looks the same. Somewhere, something is breathing. You will have to start again — and choose differently.',
      ending: { kind: 'defeat', title: 'Lost in the halls' },
    },
    {
      id: 'outside',
      title: 'Outside',
      text: 'The thread leads you back to open air. You never saw the heart of the labyrinth… but you are alive, and free to return.',
      ending: { kind: 'neutral', title: 'The way back' },
    },
  ],
};
