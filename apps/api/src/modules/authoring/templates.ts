import { type Story, StorySchema } from '@dedale/engine';

/**
 * Modèles de départ d'un nouveau récit. Le modèle « classique » montre d'emblée
 * les mécaniques (caractéristiques, épreuve, règle de mort) : un auteur
 * débutant apprend en modifiant plutôt qu'en lisant une documentation.
 */
export function starterDocument(
  title: string,
  language: string,
  template: 'blank' | 'classic',
): Story {
  const fr = language.startsWith('fr');
  if (template === 'blank') {
    return StorySchema.parse({
      title,
      language,
      start: 'debut',
      passages: [
        {
          id: 'debut',
          title: fr ? 'Le commencement' : 'The beginning',
          text: fr ? 'Il était une fois…' : 'Once upon a time…',
          position: { x: 0, y: 0 },
          ending: { kind: 'neutral', title: fr ? 'Fin' : 'The end' },
        },
      ],
    });
  }

  return StorySchema.parse({
    title,
    language,
    start: 'debut',
    variables: [
      {
        id: 'habilete',
        name: fr ? 'Habileté' : 'Skill',
        type: 'number',
        initial: 9,
        min: 0,
        icon: 'sword',
      },
      {
        id: 'endurance',
        name: fr ? 'Endurance' : 'Stamina',
        type: 'number',
        initial: 18,
        min: 0,
        icon: 'heart',
      },
      {
        id: 'chance',
        name: fr ? 'Chance' : 'Luck',
        type: 'number',
        initial: 8,
        min: 0,
        icon: 'clover',
      },
    ],
    items: [{ id: 'lanterne', name: fr ? 'Lanterne' : 'Lantern', icon: 'lamp' }],
    rules: [{ id: 'epuisement', when: 'endurance <= 0', goto: 'mort', once: true }],
    passages: [
      {
        id: 'debut',
        title: fr ? 'Le commencement' : 'The beginning',
        text: fr
          ? "Tout commence ici. Décrivez la scène d'ouverture : où se trouve le héros, que ressent-il, que voit-il ?\n\nDeux chemins s'offrent à lui."
          : 'Everything starts here. Describe the opening scene: where is the hero, what do they feel, what do they see?\n\nTwo paths lie ahead.',
        checkpoint: true,
        position: { x: 0, y: 0 },
        choices: [
          {
            id: 'gauche',
            text: fr ? 'Prendre le sentier de gauche' : 'Take the left path',
            to: 'foret',
          },
          {
            id: 'droite',
            text: fr ? 'Prendre la route de droite' : 'Take the right road',
            to: 'riviere',
            effects: [{ kind: 'give', item: 'lanterne', qty: 1 }],
          },
        ],
      },
      {
        id: 'foret',
        title: fr ? 'La forêt' : 'The forest',
        text: fr
          ? 'Les arbres se referment derrière vous. Une branche craque.'
          : 'The trees close behind you. A branch snaps.',
        position: { x: -240, y: 200 },
        choices: [
          {
            id: 'chance',
            text: fr ? 'Avancer sans bruit' : 'Move silently',
            test: {
              label: fr ? 'Tentez votre chance' : 'Test your luck',
              dice: '2d6',
              compare: 'lte',
              target: 'chance',
              effects: [{ kind: 'add', var: 'chance', value: '-1' }],
              success: {
                to: 'victoire',
                effects: [],
                text: fr ? 'Vous passez inaperçu.' : 'You slip by unseen.',
              },
              failure: {
                to: 'riviere',
                effects: [{ kind: 'add', var: 'endurance', value: '-4' }],
                text: fr ? 'On vous a repéré !' : 'You have been spotted!',
              },
            },
          },
        ],
      },
      {
        id: 'riviere',
        title: fr ? 'La rivière' : 'The river',
        text: fr
          ? "{{#if has lanterne}}Votre lanterne éclaire un gué.{{else}}L'eau noire gronde à vos pieds.{{/if}}"
          : '{{#if has lanterne}}Your lantern reveals a ford.{{else}}Black water roars at your feet.{{/if}}',
        position: { x: 240, y: 200 },
        choices: [
          {
            id: 'traverser',
            text: fr ? 'Traverser' : 'Cross',
            to: 'victoire',
            condition: 'has lanterne',
            lockedHint: fr ? 'Il fait trop sombre.' : 'It is too dark.',
          },
          { id: 'nager', text: fr ? 'Nager' : 'Swim', to: 'mort' },
        ],
      },
      {
        id: 'victoire',
        title: fr ? 'Victoire' : 'Victory',
        text: fr ? 'Vous avez atteint votre but.' : 'You reached your goal.',
        position: { x: 0, y: 420 },
        ending: { kind: 'victory', title: fr ? 'Le bout du chemin' : 'The end of the road' },
      },
      {
        id: 'mort',
        title: fr ? 'La fin' : 'The end',
        text: fr ? 'Votre aventure s’arrête ici.' : 'Your adventure ends here.',
        position: { x: 320, y: 420 },
        ending: { kind: 'death', title: fr ? 'Emporté' : 'Swept away' },
      },
    ],
  });
}
