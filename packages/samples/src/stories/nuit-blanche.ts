import type { SampleStory } from '../types';

/**
 * Nuit blanche à Montmartre — enquête sans dés : indices, déduction,
 * texte conditionnel et jauge de méfiance (règle globale).
 */
export const nuitBlanche: SampleStory = {
  slug: 'nuit-blanche-a-montmartre',
  author: 'malik',
  meta: {
    tagline:
      'Paris, 1926. Un peintre est mort. Une innocente sera accusée à l’aube — sauf si vous trouvez la vérité.',
    synopsis:
      "Jeanne Ferrand, jeune reporter au Petit Parisien, arrive la première dans l'atelier du peintre Émile Castagne, retrouvé sans vie au Bateau-Lavoir. Le commissaire veut arrêter Nina, son modèle, avant le lever du jour. Il vous reste une nuit pour arpenter la Butte, interroger ses fantômes et relier les indices. Chaque question compte, chaque imprudence aussi.",
    genres: ['mystery', 'thriller', 'historical'],
    tags: ['enquête', 'paris', 'années folles', 'déduction'],
    ageRating: '13',
    contentWarnings: ['death', 'violence'],
    access: 'premium',
    priceCents: null,
    license: 'all-rights-reserved',
  },
  document: {
    title: 'Nuit blanche à Montmartre',
    language: 'fr',
    start: 'atelier',
    variables: [
      {
        id: 'indices',
        name: 'Indices',
        type: 'number',
        initial: 0,
        min: 0,
        icon: 'search',
        description: 'Les preuves que vous avez rassemblées.',
      },
      {
        id: 'mefiance',
        name: 'Méfiance de la police',
        type: 'number',
        initial: 0,
        min: 0,
        max: 3,
        icon: 'badge',
        description: 'À 3, le commissaire vous fait arrêter.',
      },
      { id: 'vu_tache', name: 'Tache bleue', type: 'boolean', initial: false, visible: false },
      {
        id: 'alibi_lazare',
        name: 'Alibi de Lazare',
        type: 'boolean',
        initial: false,
        visible: false,
      },
    ],
    items: [
      {
        id: 'lettre',
        name: 'Lettre de menaces',
        description: 'Signée d’un simple « V. ».',
        icon: 'mail',
      },
      {
        id: 'photo',
        name: 'Photographie',
        description: 'Deux hommes identiques devant une toile.',
        icon: 'camera',
      },
    ],
    achievements: [
      {
        id: 'fin_limier',
        name: 'Fin limier',
        description: 'Réunir au moins quatre indices.',
        icon: 'search',
      },
      {
        id: 'double_fond',
        name: 'Double fond',
        description: 'Percer le vrai secret de l’atelier.',
        icon: 'mask',
        secret: true,
      },
    ],
    rules: [{ id: 'arrestation', when: 'mefiance >= 3', goto: 'arretee', once: true }],
    settings: { rewind: 'free', showChoiceStats: true, lockedChoices: 'show' },
    passages: [
      {
        id: 'atelier',
        title: "L'atelier du Bateau-Lavoir",
        checkpoint: true,
        text: `Minuit passé. L'atelier sent la térébenthine et le tabac froid. Émile Castagne gît au pied de son chevalet, le visage tourné vers une toile inachevée.

Dans un coin, Nina, son modèle, sanglote dans un châle trop grand pour elle. Un agent en pèlerine garde la porte en bâillant.

{{#if indices >= 2}}Vos notes se remplissent. Les pièces du puzzle commencent à s'emboîter.{{else}}Vous avez une heure, peut-être deux, avant l'arrivée du commissaire Bourdieu.{{/if}}`,
        choices: [
          { id: 'corps', text: 'Examiner le corps', to: 'corps', once: true },
          { id: 'bureau', text: 'Fouiller le secrétaire', to: 'bureau', once: true },
          { id: 'nina', text: 'Interroger Nina', to: 'nina', once: true },
          { id: 'sortir', text: 'Attendre le commissaire', to: 'commissaire' },
        ],
      },
      {
        id: 'corps',
        title: 'Le corps',
        onEnter: [
          { kind: 'set', var: 'vu_tache', value: 'true' },
          { kind: 'add', var: 'indices', value: '1' },
        ],
        text: `Pas de sang. Une marque violacée à la tempe, comme un coup porté par un objet lourd.

Mais c'est autre chose qui retient votre attention : sur la manche de Castagne, une trace de peinture d'un **bleu profond**, presque noir. Du bleu de Prusse. Vous jetez un œil à sa palette : il n'y en a pas une goutte. Castagne peignait les couchers de soleil, tout en ocres et en vermillons.

Quelqu'un d'autre, ici, maniait le bleu.`,
        choices: [{ id: 'retour', text: 'Noter l’indice et continuer', to: 'atelier' }],
      },
      {
        id: 'bureau',
        title: 'Le secrétaire',
        onEnter: [
          { kind: 'give', item: 'lettre', qty: 1 },
          { kind: 'add', var: 'indices', value: '1' },
        ],
        text: `Factures impayées, esquisses froissées, un billet de tram. Et, glissée sous le sous-main, une lettre à l'écriture nerveuse :

> *Tu signeras ces toiles, Émile, ou tout Paris saura d'où viennent tes « chefs-d'œuvre ». Tu n'as pas le choix. — V.*

Vous la glissez dans votre carnet avant que l'agent ne se retourne.`,
        choices: [{ id: 'retour', text: 'Refermer le secrétaire', to: 'atelier' }],
      },
      {
        id: 'nina',
        title: 'Nina',
        text: `— Je n'ai rien fait, murmure Nina. Je suis arrivée à onze heures, il était déjà… comme ça.

Elle serre son châle.

— Lazare est passé ce soir. Lazare Moreau, le peintre d'en face. Ils se sont disputés, je les ai entendus depuis l'escalier. Et puis… il y avait ce monsieur de la galerie, Varenne. Il venait souvent, ces derniers temps. Émile avait peur de lui.

{{#if has lettre}}« V. », comme Varenne. Vous sentez la lettre brûler dans votre poche.{{/if}}`,
        choices: [{ id: 'retour', text: 'La remercier', to: 'atelier' }],
      },
      {
        id: 'commissaire',
        title: 'Le commissaire Bourdieu',
        text: `Le commissaire Bourdieu entre en secouant son chapeau mouillé. Il jette un regard au corps, un autre à Nina.

— Le modèle. C'est toujours le modèle. Agent, embarquez-la.

Nina pâlit. Vous faites un pas en avant.`,
        choices: [
          {
            id: 'convaincre',
            text: "Lui demander jusqu'à l'aube pour prouver son innocence",
            to: 'rue',
            condition: 'indices >= 2',
            lockedHint: 'Sans preuves, il ne vous écoutera pas.',
          },
          {
            id: 'insister',
            text: 'Protester vivement',
            to: 'commissaire-agace',
            effects: [{ kind: 'add', var: 'mefiance', value: '1' }],
          },
          { id: 'laisser', text: 'Se taire', to: 'nina-arretee' },
        ],
      },
      {
        id: 'commissaire-agace',
        title: 'Un commissaire agacé',
        text: `— Mademoiselle la journaliste, gronde Bourdieu, encore un mot et c'est vous que j'emmène.

Il vous toise. Méfiance : **{{mefiance}}/3**.

— Vous avez des preuves ? Non ? Alors laissez travailler les grandes personnes.`,
        choices: [
          { id: 'retour', text: "Retourner fouiller l'atelier en vitesse", to: 'atelier' },
          { id: 'laisser', text: 'Baisser les yeux', to: 'nina-arretee' },
        ],
      },
      {
        id: 'rue',
        title: 'La Butte, la nuit',
        checkpoint: true,
        text: `Bourdieu mâchonne sa moustache, regarde vos notes, puis sa montre.

— L'aube, pas une minute de plus.

Dehors, Montmartre ne dort jamais vraiment. Des éclats de rire montent du Lapin Agile, un accordéon traîne quelque part rue des Saules. En contrebas, les vitrines de la galerie Varenne sont éteintes.

{{#if indices >= 4}}Vous avez presque tout. Il manque la pièce maîtresse.{{/if}}`,
        choices: [
          { id: 'lazare', text: 'Retrouver Lazare au Lapin Agile', to: 'lazare', once: true },
          { id: 'galerie', text: 'Aller à la galerie Varenne', to: 'galerie' },
        ],
      },
      {
        id: 'lazare',
        title: 'Le Lapin Agile',
        onEnter: [{ kind: 'set', var: 'alibi_lazare', value: 'true' }],
        text: `Lazare Moreau est affalé au fond de la salle, une absinthe devant lui.

— Oui, je me suis disputé avec Émile. Il m'avait « emprunté » une toile. Mais je suis ici depuis dix heures, demandez à Frédé.

Le patron hoche la tête derrière son comptoir.

{{#if has lettre}}Vous lui montrez la lettre. Il blêmit.

— Varenne… Tout le monde sait qu'il vend des faux. Émile peignait des « Castagne » pour lui, et Varenne les signait d'autres noms. Émile voulait tout arrêter.{{else}}— Si vous voulez un coupable, ajoute-t-il, allez donc voir du côté des marchands.{{/if}}`,
        choices: [
          {
            id: 'noter',
            text: 'Noter ce témoignage',
            to: 'rue',
            effects: [{ kind: 'add', var: 'indices', value: 'count(lettre)' }],
          },
        ],
      },
      {
        id: 'galerie',
        title: 'La galerie Varenne',
        text: `La galerie est plongée dans le noir. À travers la vitrine, vous devinez des toiles empilées contre les murs et une lumière qui filtre sous une porte, à l'arrière-boutique.

La serrure de la porte de service a l'air vieille.`,
        choices: [
          {
            id: 'crocheter',
            text: 'Crocheter la serrure avec une épingle à cheveux',
            to: 'reserve',
            effects: [{ kind: 'add', var: 'mefiance', value: '1' }],
          },
          { id: 'attendre', text: 'Attendre Varenne dans l’ombre', to: 'varenne' },
        ],
      },
      {
        id: 'reserve',
        title: "L'arrière-boutique",
        onEnter: [
          { kind: 'add', var: 'indices', value: '2' },
          { kind: 'give', item: 'photo', qty: 1 },
        ],
        text: `Une douzaine de toiles « signées » de maîtres célèbres sèchent sur des tréteaux. Des faux, de toute évidence.

Sur l'établi, un pinceau encore humide, trempé dans un **bleu de Prusse** profond.
{{#if vu_tache}}C'est le même bleu que sur la manche de Castagne. Vous en êtes certaine.{{/if}}

Punaisée au mur, une vieille photographie : deux jeunes hommes absolument identiques posent devant un chevalet. Au dos, une inscription : *Émile et Lucien, 1911.*

Des pas dans la rue. Quelqu'un arrive.`,
        choices: [
          { id: 'cacher', text: 'Glisser la photo dans votre poche et sortir', to: 'varenne' },
        ],
      },
      {
        id: 'varenne',
        title: 'Varenne',
        text: `Octave Varenne apparaît, col relevé, une valise à la main. Il s'arrête net en vous voyant.

— Une journaliste. À cette heure-ci. Que puis-je pour vous ?

Derrière lui, au coin de la rue, la silhouette massive du commissaire Bourdieu qui vous a suivie. Il n'a pas l'air content.

Indices réunis : **{{indices}}**. Méfiance : **{{mefiance}}/3**.`,
        choices: [
          {
            id: 'accuser',
            text: 'Accuser Varenne devant le commissaire, preuves à l’appui',
            to: 'verite',
            condition: 'indices >= 4',
            lockedHint: 'Vos preuves sont encore trop minces.',
          },
          {
            id: 'bluffer',
            text: 'Bluffer : « Je sais tout »',
            to: 'seine',
          },
          {
            id: 'lucien',
            text: '« Où est Lucien, monsieur Varenne ? »',
            to: 'double',
            condition: 'has photo and vu_tache and alibi_lazare',
            locked: 'hide',
          },
        ],
      },
      {
        id: 'verite',
        title: "L'aube sur la Butte",
        ending: { kind: 'victory', title: "L'aube sur la Butte" },
        onEnter: [{ kind: 'unlock', achievement: 'fin_limier' }],
        text: `Vous alignez les preuves une à une : la lettre signée « V. », le bleu de Prusse sur la manche du mort et sur l'établi de la galerie, les faux entassés dans l'arrière-boutique.

Bourdieu écoute, les sourcils froncés. Puis il pose une main lourde sur l'épaule de Varenne.

— Octave Varenne, vous allez m'expliquer tout ça au Quai des Orfèvres.

Le soleil se lève sur Paris. Nina est libre. Et demain, votre article fera la une du *Petit Parisien*.`,
      },
      {
        id: 'double',
        title: 'Le double du peintre',
        ending: { kind: 'secret', title: 'Le double du peintre' },
        onEnter: [{ kind: 'unlock', achievement: 'double_fond' }],
        text: `Varenne lâche sa valise. Elle s'ouvre sur le pavé : des billets, un passeport… au nom d'**Émile Castagne**.

— Lucien était le faussaire, souffle-t-il. Le frère jumeau. C'est lui qui peignait les faux, avec son maudit bleu de Prusse. Quand Émile a voulu tout révéler, ils se sont battus… Lucien est tombé.

Le mort de l'atelier n'est pas Émile. C'est son frère. Et le vrai Castagne, à cette heure, attend Varenne sur un quai de la gare du Nord, prêt à disparaître sous l'identité de son jumeau.

Bourdieu siffle deux agents. Ils courent vers la gare. Vous, vous tenez l'article du siècle.`,
      },
      {
        id: 'seine',
        title: 'La Seine en hiver',
        ending: { kind: 'death', title: 'La Seine en hiver' },
        text: `— Vous savez tout ? sourit Varenne. Alors vous comprendrez.

Vous ne voyez pas venir le coup. Quand Bourdieu arrive au coin de la rue, il n'y a plus personne. Seulement un carnet de reporter, trempé, qu'on repêchera deux jours plus tard au pont Marie.`,
      },
      {
        id: 'nina-arretee',
        title: 'Une innocente derrière les barreaux',
        ending: { kind: 'defeat', title: 'Une innocente derrière les barreaux' },
        text: `Les menottes claquent sur les poignets de Nina. Elle vous regarde une dernière fois, sans colère, seulement avec une immense fatigue.

Le lendemain, les journaux titrent « Le crime passionnel du Bateau-Lavoir ». L'affaire est classée en une semaine.

Vous garderez longtemps le sentiment d'avoir laissé passer quelque chose d'essentiel.`,
      },
      {
        id: 'arretee',
        title: 'Au dépôt',
        ending: { kind: 'defeat', title: 'Au dépôt' },
        text: `— Ça suffit ! tonne Bourdieu. Effraction, entrave à l'enquête… Vous passerez la nuit au dépôt, mademoiselle.

Derrière les barreaux, vous entendez sonner six heures. L'aube est là. Nina aussi a été arrêtée, et le vrai coupable court toujours.`,
      },
    ],
  },
};
