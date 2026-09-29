import type { SampleStory } from '../types';

/**
 * La Dernière Lettre — drame intimiste, sans mécanique de jeu : la
 * narration interactive au service de l'émotion. Vendu à l'unité.
 */
export const derniereLettre: SampleStory = {
  slug: 'la-derniere-lettre',
  author: 'aurore',
  meta: {
    tagline: 'Sept lettres jamais envoyées. Une seule question : à qui les donner ?',
    synopsis:
      "En vidant l'appartement de son père, Lou trouve une boîte à chaussures remplie de lettres jamais postées, adressées à des personnes qu'elle n'a jamais connues. Un premier amour, un frère fâché, un ami perdu de vue. Faut-il les remettre, les lire, les brûler ? Une courte histoire sur le deuil, les secrets de famille et ce qu'on ose enfin se dire.",
    genres: ['drama'],
    tags: ['deuil', 'famille', 'intimiste', 'lecture courte'],
    ageRating: '13',
    contentWarnings: ['grief'],
    access: 'paid',
    priceCents: 299,
    license: 'all-rights-reserved',
  },
  document: {
    title: 'La Dernière Lettre',
    language: 'fr',
    start: 'boite',
    variables: [
      {
        id: 'courage',
        name: 'Courage',
        type: 'number',
        initial: 0,
        min: 0,
        icon: 'feather',
        description: 'Ce que Lou ose affronter.',
      },
    ],
    items: [],
    achievements: [],
    rules: [],
    settings: { rewind: 'none', showChoiceStats: true, lockedChoices: 'show' },
    passages: [
      {
        id: 'boite',
        title: 'La boîte à chaussures',
        text: `L'appartement sent encore son tabac à pipe. Lou a déjà rempli trois cartons pour Emmaüs quand elle la trouve, tout en haut de l'armoire : une boîte à chaussures fermée par un élastique.

À l'intérieur, sept enveloppes. Timbrées, adressées, jamais postées. L'écriture penchée de son père.

La première est pour une certaine *Hélène Marchal, Saint-Malo*.`,
        choices: [
          { id: 'lire', text: 'Ouvrir la lettre à Hélène', to: 'helene' },
          { id: 'refermer', text: 'Refermer la boîte. Pas aujourd’hui.', to: 'placard' },
        ],
      },
      {
        id: 'placard',
        title: 'Pas aujourd’hui',
        text: `Lou remet l'élastique, repose la boîte sur l'armoire. Ses mains tremblent.

Elle termine les cartons en silence. Mais au moment d'éteindre la lumière, elle se retourne.`,
        choices: [
          {
            id: 'reprendre',
            text: 'Reprendre la boîte',
            to: 'helene',
            effects: [{ kind: 'add', var: 'courage', value: '1' }],
          },
          { id: 'partir', text: 'Fermer la porte derrière elle', to: 'oubli' },
        ],
      },
      {
        id: 'helene',
        title: 'Hélène',
        onEnter: [{ kind: 'add', var: 'courage', value: '1' }],
        text: `*« Hélène, j'avais vingt ans et je n'ai pas eu le cran de prendre ce train. Je t'ai regardée partir depuis le quai. J'ai eu une belle vie, tu sais. Une fille merveilleuse. Mais je n'ai jamais cessé de me demander. »*

Lou relit la lettre trois fois. Son père n'a jamais parlé d'Hélène. Jamais.

Il reste six enveloppes. Dont une, tout au fond, à son nom à elle.`,
        choices: [
          { id: 'sienne', text: 'Ouvrir la lettre qui lui est adressée', to: 'lou' },
          { id: 'saint-malo', text: 'Chercher Hélène Marchal à Saint-Malo', to: 'saint-malo' },
        ],
      },
      {
        id: 'saint-malo',
        title: 'Saint-Malo',
        onEnter: [{ kind: 'add', var: 'courage', value: '2' }],
        text: `Il a fallu deux jours de recherches, un annuaire et beaucoup de courage. La maison est blanche, face à la mer.

La vieille dame qui ouvre la porte a les yeux clairs et une canne à pommeau d'argent. Quand Lou prononce le nom de son père, elle porte la main à sa bouche.

— Entrez, dit-elle simplement. J'ai attendu cette lettre cinquante ans.`,
        choices: [
          { id: 'donner', text: 'Lui tendre la lettre', to: 'rencontre' },
          { id: 'fuir', text: 'Balbutier une excuse et repartir', to: 'oubli' },
        ],
      },
      {
        id: 'lou',
        title: 'Pour Lou',
        text: `*« Ma Lou. Si tu lis ceci, c'est que je ne suis plus là pour te dire tout ce que je n'ai jamais su dire. Ces lettres sont mes lâchetés. Fais-en ce que tu veux. Mais toi, ne garde rien dans une boîte. Promets-le moi. »*

{{#if courage >= 2}}Lou sourit à travers ses larmes. Elle sait déjà ce qu'elle va faire.{{else}}Lou serre la lettre contre elle. Elle ne sait pas si elle en aura la force.{{/if}}`,
        choices: [
          {
            id: 'poster',
            text: 'Poster toutes les lettres',
            to: 'poste',
            condition: 'courage >= 2',
            lockedHint: 'Pas encore. Il lui faut un peu plus de courage.',
          },
          { id: 'garder', text: 'Tout garder pour elle', to: 'oubli' },
          { id: 'helene', text: 'Commencer par Hélène', to: 'saint-malo' },
        ],
      },
      {
        id: 'rencontre',
        title: 'Cinquante ans après',
        ending: { kind: 'victory', title: 'Cinquante ans après' },
        text: `Hélène lit la lettre à voix haute, lentement, puis elle la plie en quatre et la glisse dans la poche de son gilet, contre son cœur.

Elles parlent jusqu'à la nuit. D'un garçon de vingt ans que Lou n'a jamais connu, d'un train manqué, de la mer.

En partant, Lou a six enveloppes dans son sac, et la promesse d'Hélène de l'accompagner pour les suivantes.`,
      },
      {
        id: 'poste',
        title: 'Le bureau de poste',
        ending: { kind: 'victory', title: 'Le courrier du lundi' },
        text: `Le lundi matin, Lou dépose sept enveloppes au guichet. L'employé fronce les sourcils devant les timbres d'un autre siècle, puis hausse les épaules.

— Elles arriveront, madame. Avec un peu de retard.

Dans les semaines qui suivent, des réponses commencent à arriver. Des inconnus qui connaissaient son père mieux qu'elle. Et, lentement, une famille qu'elle ne soupçonnait pas.`,
      },
      {
        id: 'oubli',
        title: 'La boîte fermée',
        ending: { kind: 'neutral', title: 'La boîte fermée' },
        text: `La boîte repart avec Lou, intacte. Elle la range tout en haut de sa propre armoire.

Parfois, la nuit, elle y pense. Elle se dit qu'un jour, peut-être.

Et les années passent, comme elles sont passées pour son père.`,
      },
    ],
  },
};
