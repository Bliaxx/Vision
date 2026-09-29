import type { SampleStory } from '../types';

/**
 * Le Jardin de Mila — jeunesse, tous publics : aucune mort, une jauge
 * d'amitié, des objets et une fin secrète poétique.
 */
export const jardinDeMila: SampleStory = {
  slug: 'le-jardin-de-mila',
  author: 'ines',
  meta: {
    tagline:
      'Derrière le mur de la grand-mère, il y a un jardin où les plantes parlent. Et un escargot qui a perdu ses couleurs.',
    synopsis:
      "Pendant les vacances chez sa grand-mère, Mila découvre une petite porte cachée sous le lierre. De l'autre côté, un jardin enchanté où les tournesols bavardent et où Gaston, un escargot très poli, a perdu toutes les couleurs de sa coquille. Mila saura-t-elle l'aider à temps pour la fête de la pleine lune ? Une histoire douce, pour lire seul dès 7 ans ou à deux voix.",
    genres: ['youth', 'fantasy'],
    tags: ['jeunesse', 'amitié', 'nature', 'dès 7 ans'],
    ageRating: 'all',
    contentWarnings: [],
    access: 'free',
    priceCents: null,
    license: 'cc-by',
  },
  document: {
    title: 'Le Jardin de Mila',
    language: 'fr',
    start: 'mur',
    variables: [
      {
        id: 'amitie',
        name: 'Amitié',
        type: 'number',
        initial: 0,
        min: 0,
        max: 10,
        icon: 'heart',
        description: 'Plus elle grandit, plus le jardin vous fait confiance.',
      },
    ],
    items: [
      {
        id: 'arrosoir',
        name: 'Petit arrosoir',
        description: 'Un arrosoir bleu, pile à votre taille.',
        icon: 'droplet',
      },
      {
        id: 'graine',
        name: 'Graine de lune',
        description: 'Elle brille doucement dans le noir.',
        icon: 'moon',
      },
      {
        id: 'couleurs',
        name: 'Pétales de toutes les couleurs',
        description: 'Rouge, orange, jaune, vert, bleu, violet.',
        icon: 'flower',
        stackable: true,
      },
    ],
    achievements: [
      {
        id: 'amie_du_jardin',
        name: 'Amie du jardin',
        description: 'Atteindre 5 points d’amitié.',
        icon: 'heart',
      },
      {
        id: 'jusqua_la_lune',
        name: 'Jusqu’à la lune',
        description: 'Planter la graine de lune.',
        icon: 'moon',
        secret: true,
      },
    ],
    rules: [],
    settings: { rewind: 'free', showChoiceStats: true, lockedChoices: 'show' },
    passages: [
      {
        id: 'mur',
        title: 'Le mur de lierre',
        text: `Chez Mamie Jo, il y a un grand mur couvert de lierre au fond du jardin. Mila le connaît par cœur. Enfin… c'est ce qu'elle croyait.

Ce matin, en cherchant son ballon, elle écarte les feuilles et découvre une **toute petite porte** en bois, peinte en vert. Elle est juste assez grande pour une enfant.

Sur la poignée, quelqu'un a accroché une étiquette : *« Entrée des amis. »*`,
        choices: [
          { id: 'entrer', text: 'Pousser la petite porte', to: 'jardin' },
          { id: 'mamie', text: 'Aller chercher Mamie Jo', to: 'mamie' },
        ],
      },
      {
        id: 'mamie',
        title: 'Mamie Jo',
        onEnter: [{ kind: 'give', item: 'arrosoir', qty: 1 }],
        text: `Mamie Jo écoute Mila en souriant, comme si elle n'était pas surprise du tout.

— Une porte verte ? Tiens, tiens. Alors emporte ceci, ma chérie. Là-bas, on a toujours besoin d'un peu d'eau.

Elle lui tend un **petit arrosoir bleu**, pile à sa taille. Et elle lui fait un clin d'œil.`,
        choices: [{ id: 'entrer', text: 'Retourner à la porte et entrer', to: 'jardin' }],
      },
      {
        id: 'jardin',
        title: 'Le jardin qui parle',
        checkpoint: true,
        text: `De l'autre côté, tout est plus grand, plus vert, plus parfumé. Les tournesols tournent la tête vers Mila comme des curieux à une fenêtre.

— Une visiteuse ! chuchote l'un d'eux.
— Elle a l'air gentille, répond un autre.

Au pied d'un rosier, un escargot soupire. Sa coquille est toute **grise**, pâle comme une pierre.

{{#if amitie >= 3}}Les fleurs se penchent vers Mila : elles commencent à l'aimer beaucoup.{{/if}}`,
        choices: [
          { id: 'gaston', text: "Parler à l'escargot", to: 'gaston' },
          { id: 'tournesols', text: 'Saluer les tournesols', to: 'tournesols', once: true },
          { id: 'mare', text: 'Aller voir la petite mare', to: 'mare' },
        ],
      },
      {
        id: 'tournesols',
        title: 'Les tournesols',
        onEnter: [{ kind: 'add', var: 'amitie', value: '1' }],
        text: `— Bonjour, dit poliment Mila.

Les tournesols sont si contents qu'ils en perdent quelques graines.

— Personne ne nous dit jamais bonjour ! Tu sais, Gaston l'escargot est très triste. Ce soir, c'est la fête de la pleine lune, et il ne veut pas y aller tout gris.

Amitié : **{{amitie}}**.`,
        choices: [{ id: 'retour', text: 'Retourner au centre du jardin', to: 'jardin' }],
      },
      {
        id: 'gaston',
        title: 'Gaston',
        text: `— Excusez-moi de ne pas me lever, dit l'escargot. Je m'appelle Gaston. Enchanté.

Il raconte qu'hier, un gros orage a délavé sa coquille. Toutes ses couleurs sont parties avec la pluie.

— Pour les retrouver, il faudrait un pétale de chaque couleur, soupire-t-il. Mais les fleurs sont si fières… Elles ne donnent leurs pétales qu'à leurs amis.

{{#if has couleurs 6}}Mila ouvre ses mains : elle a tous les pétales !{{/if}}`,
        choices: [
          {
            id: 'donner',
            text: 'Offrir les pétales à Gaston',
            to: 'coquille',
            condition: 'has couleurs 6',
            lockedHint: 'Il faut un pétale de chaque couleur.',
          },
          { id: 'fleurs', text: 'Aller demander des pétales aux fleurs', to: 'massif' },
          { id: 'jardin', text: 'Retourner au centre du jardin', to: 'jardin' },
        ],
      },
      {
        id: 'massif',
        title: 'Le massif des fleurs',
        text: `Les fleurs du massif ont soif. Leurs feuilles pendent, leur terre est craquelée.

— Des pétales ? grommelle une pivoine. Et pourquoi on t'en donnerait, à toi ?

{{#if has arrosoir}}Mila serre le petit arrosoir bleu de Mamie Jo.{{/if}}`,
        choices: [
          {
            id: 'arroser',
            text: 'Arroser les fleurs une à une',
            to: 'petales',
            condition: 'has arrosoir',
            lockedHint: "Il faudrait de quoi transporter l'eau de la mare.",
            effects: [{ kind: 'add', var: 'amitie', value: '3' }],
          },
          {
            id: 'chanter',
            text: 'Leur chanter une chanson',
            to: 'petales',
            condition: 'amitie >= 1',
            lockedHint: 'Les fleurs ne vous connaissent pas encore assez.',
            effects: [{ kind: 'add', var: 'amitie', value: '2' }],
          },
          { id: 'retour', text: 'Revenir plus tard', to: 'jardin' },
        ],
      },
      {
        id: 'petales',
        title: 'Un arc-en-ciel de pétales',
        onEnter: [{ kind: 'give', item: 'couleurs', qty: 6 }],
        text: `Les fleurs se redressent, ravies. La pivoine rougit — ce qui, pour une pivoine, n'est pas bien difficile.

Une à une, elles offrent un pétale à Mila : **rouge**, **orange**, **jaune**, **vert**, **bleu** et **violet**.

— Pour Gaston, disent-elles. Et pour toi, notre amie.

Amitié : **{{amitie}}**.`,
        choices: [{ id: 'gaston', text: 'Courir retrouver Gaston', to: 'gaston' }],
      },
      {
        id: 'mare',
        title: 'La petite mare',
        text: `La mare est ronde comme un miroir. Une grenouille en gilet y pêche des reflets d'étoiles.

— Une graine de lune ? Il y en a une au fond, depuis cent ans. Elle ne pousse que si on la plante avec un cœur plein d'amitié.

{{#if amitie >= 5}}La grenouille plonge et remonte avec une petite graine qui brille comme une veilleuse.{{else}}— Reviens quand tout le jardin te connaîtra, ajoute-t-elle.{{/if}}`,
        choices: [
          {
            id: 'graine',
            text: 'Accepter la graine de lune',
            to: 'jardin',
            once: true,
            condition: 'amitie >= 5',
            lockedHint: "L'amitié du jardin n'est pas encore assez grande.",
            effects: [
              { kind: 'give', item: 'graine', qty: 1 },
              { kind: 'unlock', achievement: 'amie_du_jardin' },
            ],
          },
          { id: 'retour', text: 'Retourner au jardin', to: 'jardin' },
        ],
      },
      {
        id: 'coquille',
        title: 'La coquille arc-en-ciel',
        onEnter: [
          { kind: 'take', item: 'couleurs', qty: 6 },
          { kind: 'add', var: 'amitie', value: '2' },
        ],
        text: `Gaston pose délicatement chaque pétale sur sa coquille. Et, comme par magie, les couleurs s'y fondent en spirale : rouge, orange, jaune, vert, bleu, violet.

— Oh ! s'exclame-t-il. Je suis… magnifique !

La lune se lève au-dessus du mur. Dans tout le jardin, des lucioles s'allument une à une. La fête va commencer.`,
        choices: [
          { id: 'fete', text: 'Aller à la fête avec Gaston', to: 'fete' },
          {
            id: 'planter',
            text: 'Planter la graine de lune au milieu de la fête',
            to: 'lune',
            condition: 'has graine',
            locked: 'hide',
          },
          { id: 'rentrer', text: 'Rentrer chez Mamie Jo avant la nuit', to: 'retour' },
        ],
      },
      {
        id: 'fete',
        title: 'La fête de la pleine lune',
        ending: { kind: 'victory', title: 'La fête de la pleine lune' },
        text: `Toute la nuit, on danse dans le jardin. Les tournesols battent la mesure, la grenouille joue du violon, et Gaston, fier comme un paon, fait trois fois le tour de la mare sous les applaudissements.

Quand Mila rentre enfin, Mamie Jo l'attend avec un chocolat chaud.

— Alors ? demande-t-elle.
— Alors j'ai des nouveaux amis, répond Mila en bâillant.`,
      },
      {
        id: 'lune',
        title: "Jusqu'à la lune",
        ending: { kind: 'secret', title: "Jusqu'à la lune" },
        onEnter: [{ kind: 'unlock', achievement: 'jusqua_la_lune' }],
        text: `Mila creuse un petit trou et y dépose la graine de lune. À peine l'a-t-elle recouverte de terre qu'une tige argentée jaillit, grandit, grandit — plus haut que le mur, plus haut que les nuages.

Au sommet, la lune se penche et attrape la tige comme on attrape une main.

— Monte, disent les fleurs. Tu l'as bien mérité.

Et cette nuit-là, Mila et Gaston ont pris le thé sur la lune. Mais ça, c'est une autre histoire.`,
      },
      {
        id: 'retour',
        title: 'À demain, le jardin',
        ending: { kind: 'neutral', title: 'À demain, le jardin' },
        text: `Mila fait un signe de la main à Gaston et referme doucement la petite porte verte.

Ce soir, elle ne verra pas la fête. Mais elle sait où se trouve le jardin, maintenant. Et demain, elle reviendra.

Le lierre frissonne, comme s'il disait : *à demain*.`,
      },
    ],
  },
};
