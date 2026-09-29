import type { SampleStory } from '../types';

/**
 * Le Phare des Brumes — fantasy maritime, mécaniques classiques du
 * livre-jeu : caractéristiques, épreuves, combat, objets, fin secrète.
 */
export const pharesDesBrumes: SampleStory = {
  slug: 'le-phare-des-brumes',
  author: 'aurore',
  meta: {
    tagline:
      'Le phare de Ker-Ys s’est éteint. Un navire approche des récifs. Vous avez jusqu’à l’aube.',
    synopsis:
      "Apprentie gardienne de phare, vous débarquez de nuit sur l'îlot de Ker-Ys : la lanterne s'est éteinte, le vieux gardien a disparu et, quelque part dans le brouillard, un trois-mâts file droit sur les récifs. Fouillez, affrontez ce qui rôde dans la brume et rallumez la flamme — ou découvrez ce que la mer cache depuis mille ans sous l'île.",
    genres: ['fantasy', 'mystery', 'adventure'],
    tags: ['livre-jeu', 'bretagne', 'légende', 'combat'],
    ageRating: '10',
    contentWarnings: ['fear', 'death'],
    access: 'free',
    priceCents: null,
    license: 'cc-by-nc',
  },
  document: {
    title: 'Le Phare des Brumes',
    language: 'fr',
    start: 'greve',
    variables: [
      {
        id: 'habilete',
        name: 'Habileté',
        type: 'number',
        initial: 9,
        min: 0,
        icon: 'sword',
        description: 'Votre adresse et votre sang-froid.',
      },
      {
        id: 'endurance',
        name: 'Endurance',
        type: 'number',
        initial: 16,
        min: 0,
        max: 20,
        icon: 'heart',
        description: 'Votre énergie vitale.',
      },
      {
        id: 'chance',
        name: 'Chance',
        type: 'number',
        initial: 9,
        min: 0,
        icon: 'clover',
        description: 'Diminue de 1 à chaque fois que vous la tentez.',
      },
      {
        id: 'sait_voix',
        name: 'Averti de la voix',
        type: 'boolean',
        initial: false,
        visible: false,
      },
    ],
    items: [
      {
        id: 'huile',
        name: "Fiole d'huile",
        description: 'De quoi nourrir la grande lampe.',
        icon: 'flask',
      },
      {
        id: 'briquet',
        name: 'Briquet à silex',
        description: 'Rouillé, mais il fait encore des étincelles.',
        icon: 'flame',
      },
      {
        id: 'cle_bronze',
        name: 'Clé de bronze',
        description: 'Lourde, couverte de vert-de-gris.',
        icon: 'key',
      },
      {
        id: 'amulette',
        name: 'Amulette spirale',
        description: 'Elle est tiède, comme si elle respirait.',
        icon: 'spiral',
      },
    ],
    achievements: [
      {
        id: 'lecteur_attentif',
        name: 'Lecteur attentif',
        description: 'Lire le carnet du gardien.',
        icon: 'book',
      },
      {
        id: 'vainqueur_brumeux',
        name: 'Chasse-brume',
        description: 'Vaincre le Brumeux dans l’escalier.',
        icon: 'sword',
      },
      {
        id: 'gardien_des_mondes',
        name: 'Gardienne des deux mondes',
        description: 'Découvrir le secret de Ker-Ys.',
        icon: 'spiral',
        secret: true,
      },
    ],
    rules: [{ id: 'epuisement', when: 'endurance <= 0', goto: 'epuisement', once: true }],
    settings: { rewind: 'checkpoint', showChoiceStats: true, lockedChoices: 'show' },
    passages: [
      {
        id: 'greve',
        title: 'La grève',
        checkpoint: true,
        text: `La barque racle les galets. Vous sautez dans l'eau glacée jusqu'aux genoux et tirez l'embarcation sur la grève de Ker-Ys.

Au-dessus de vous, le phare se dresse comme un doigt noir pointé vers le ciel. **Éteint.** Depuis trois nuits, aucune lumière n'a balayé la baie — et le vieux Yann, le gardien, ne répond plus aux signaux.

Au large, étouffée par le brouillard, une corne de brume gémit. Un navire. Il ne sait pas que les récifs l'attendent.

> Tu as jusqu'à l'aube, petite. Pas une minute de plus.

La voix du capitaine du port résonne encore dans votre tête.`,
        choices: [
          { id: 'phare', text: 'Monter directement au phare', to: 'porte' },
          { id: 'cabane', text: 'Fouiller la cabane du gardien', to: 'cabane' },
          { id: 'rochers', text: 'Longer la côte vers les rochers', to: 'rochers' },
          { id: 'fuir', text: 'Remonter dans la barque et renoncer', to: 'renoncement' },
        ],
      },
      {
        id: 'cabane',
        title: 'La cabane du gardien',
        text: `La porte n'est pas verrouillée. À l'intérieur, tout est sens dessus dessous : une chaise renversée, une tasse de cidre à moitié bue, des cartes marines éparpillées.

{{#if has huile}}Les étagères sont vides : vous avez déjà pris tout ce qui pouvait servir.{{else}}Sur une étagère, vous repérez une **fiole d'huile** à lampe et un vieux **briquet à silex**.{{/if}}

Sur la table, un carnet relié de cuir, ouvert, comme si Yann avait été interrompu en pleine écriture.`,
        choices: [
          {
            id: 'prendre',
            text: "Prendre la fiole d'huile et le briquet",
            to: 'cabane',
            once: true,
            effects: [
              { kind: 'give', item: 'huile', qty: 1 },
              { kind: 'give', item: 'briquet', qty: 1 },
            ],
          },
          { id: 'carnet', text: 'Lire le carnet du gardien', to: 'carnet', once: true },
          { id: 'sortir', text: 'Ressortir et monter vers le phare', to: 'porte' },
          { id: 'rochers', text: 'Aller voir les rochers', to: 'rochers' },
        ],
      },
      {
        id: 'carnet',
        title: 'Le carnet de Yann',
        onEnter: [
          { kind: 'set', var: 'sait_voix', value: 'true' },
          { kind: 'unlock', achievement: 'lecteur_attentif' },
        ],
        text: `L'écriture est tremblée, les dernières lignes presque illisibles.

*« La clé de bronze est là où le goéland de pierre regarde la mer. Ne l'oublie pas, petite.*

*La brume est revenue. Elle parle, maintenant. Elle connaît mon nom, celui de ma femme, celui de la ville d'avant.*

*Ne réponds jamais à la voix dans la brume. Jamais. »*

Un frisson vous parcourt l'échine. Dehors, le brouillard colle aux carreaux comme une main.`,
        choices: [{ id: 'retour', text: 'Refermer le carnet', to: 'cabane' }],
      },
      {
        id: 'rochers',
        title: 'Les rochers',
        text: `Les rochers luisent d'algues et de sel. Entre deux blocs couverts de lichen, une pierre sculptée en forme de goéland fixe l'horizon de ses yeux vides.

{{#if sait_voix}}*Là où le goéland de pierre regarde la mer…* C'est ici.{{else}}Étrange sculpture pour un endroit aussi désolé. On dirait qu'elle a été déplacée récemment.{{/if}}

La pierre est lourde, et la marée monte.`,
        choices: [
          {
            id: 'soulever',
            text: 'Soulever la pierre au goéland',
            test: {
              label: "Épreuve d'Habileté",
              dice: '2d6',
              compare: 'lte',
              target: 'habilete',
              success: { to: 'cachette', text: 'La pierre bascule dans un grondement sourd.' },
              failure: {
                to: 'blessure',
                effects: [{ kind: 'add', var: 'endurance', value: '-3' }],
                text: 'La pierre vous échappe et vous écrase les doigts.',
              },
            },
          },
          { id: 'phare', text: 'Retourner vers le phare', to: 'porte' },
        ],
      },
      {
        id: 'blessure',
        title: 'Doigts écrasés',
        text: `Vous serrez les dents pour ne pas crier. Vos doigts sont en sang, votre souffle court. Endurance restante : **{{endurance}}**.

Une vague plus forte que les autres vient lécher vos chevilles. La mer monte.`,
        choices: [
          { id: 'reessayer', text: 'Réessayer, malgré la douleur', to: 'rochers' },
          { id: 'renoncer', text: 'Laisser la pierre et courir au phare', to: 'porte' },
        ],
      },
      {
        id: 'cachette',
        title: 'La cachette',
        onEnter: [
          { kind: 'give', item: 'cle_bronze', qty: 1 },
          { kind: 'give', item: 'amulette', qty: 1 },
        ],
        text: `Sous la pierre, un creux sec, tapissé de sable blanc. Une **clé de bronze** y repose, enveloppée dans un chiffon huilé.

Et à côté, quelque chose que Yann n'avait jamais mentionné : un pendentif en forme de **spirale**, gravé de signes que vous ne connaissez pas. Quand vous le prenez dans votre paume, il est tiède. Comme vivant.

Au loin, la corne de brume gémit de nouveau. Plus proche.`,
        choices: [{ id: 'phare', text: 'Courir vers le phare', to: 'porte' }],
      },
      {
        id: 'porte',
        title: 'La porte du phare',
        text: `La porte du phare est bardée de fer, fermée par une serrure de bronze aussi grosse que votre poing.

Vous posez la main sur le battant quand, derrière vous, la brume se met à **chanter**. Une voix douce, familière, qui prononce votre prénom.

{{#if sait_voix}}*Ne réponds jamais à la voix dans la brume.* Les mots du carnet résonnent en vous.{{else}}Elle ressemble à celle de votre mère. C'est impossible. Et pourtant.{{/if}}`,
        choices: [
          {
            id: 'cle',
            text: 'Ouvrir avec la clé de bronze',
            to: 'escalier',
            condition: 'has cle_bronze',
            lockedHint: 'Il vous faudrait la clé de la serrure.',
          },
          {
            id: 'forcer',
            text: 'Forcer la porte à coups d’épaule',
            test: {
              label: "Épreuve d'Habileté",
              dice: '2d6',
              compare: 'lte',
              target: 'habilete - 2',
              success: {
                to: 'escalier',
                effects: [{ kind: 'add', var: 'endurance', value: '-2' }],
                text: 'Le bois cède dans un craquement.',
              },
              failure: {
                to: 'epaule',
                effects: [{ kind: 'add', var: 'endurance', value: '-4' }],
              },
            },
          },
          { id: 'voix', text: 'Répondre à la voix', to: 'voix' },
        ],
      },
      {
        id: 'epaule',
        title: 'Une porte têtue',
        text: `La porte n'a pas bougé d'un pouce. Votre épaule, elle, vous élance jusqu'au bout des doigts. Endurance : **{{endurance}}**.

La voix, derrière vous, rit doucement.`,
        choices: [{ id: 'retour', text: 'Reprendre votre souffle', to: 'porte' }],
      },
      {
        id: 'voix',
        title: 'La voix dans la brume',
        text: `— Oui ? dites-vous.

À l'instant où le mot quitte vos lèvres, le brouillard s'épaissit. Il entre dans votre bouche, dans vos yeux. La voix se fait caressante : *Viens. Viens voir la ville d'avant. Viens, ils t'attendent tous.*

Vos pieds avancent seuls vers la mer.`,
        choices: [
          {
            id: 'resister',
            text: "Lutter contre l'envoûtement",
            test: {
              label: 'Tentez votre chance',
              dice: '2d6',
              compare: 'lte',
              target: 'chance',
              effects: [{ kind: 'add', var: 'chance', value: '-1' }],
              success: {
                to: 'porte',
                text: 'Vous vous mordez la langue : la douleur vous rend à vous-même.',
              },
              failure: { to: 'noyade' },
            },
          },
          { id: 'suivre', text: 'Suivre la voix', to: 'noyade' },
        ],
      },
      {
        id: 'escalier',
        title: "L'escalier",
        checkpoint: true,
        text: `Cent vingt marches en colimaçon. Vous montez dans le noir, une main sur la pierre humide.

À mi-hauteur, l'air devient froid, épais, poisseux. La brume est entrée avec vous. Elle se ramasse sur elle-même, prend forme — des bras trop longs, un visage sans traits.

**Le Brumeux** vous barre le passage.`,
        encounter: {
          enemies: [{ id: 'brumeux', name: 'Le Brumeux', skill: 7, stamina: 8 }],
          skillVar: 'habilete',
          staminaVar: 'endurance',
          damage: 2,
          enemyDamage: 2,
          victory: {
            to: 'lanterne',
            effects: [{ kind: 'unlock', achievement: 'vainqueur_brumeux' }],
            text: 'Le Brumeux se disperse en lambeaux de vapeur.',
          },
          defeat: { to: 'noyade' },
          flee: { to: 'greve', damage: 2, afterRound: 2 },
        },
      },
      {
        id: 'lanterne',
        title: 'La chambre de la lanterne',
        text: `Au sommet, la grande lentille de Fresnel luit faiblement sous la lune voilée. La lampe est sèche. Le réservoir, vide.

{{#if has huile and has briquet}}Vous sortez la fiole et le briquet de votre sac. Vos mains tremblent.{{else}}Il vous faudrait de l'huile et de quoi faire une flamme. Tout est resté en bas.{{/if}}

{{#if has amulette}}Contre votre poitrine, l'amulette spirale est devenue **brûlante**. Elle pulse, au même rythme que la mer.{{/if}}

Par la vitre, vous distinguez enfin les feux du navire. Il est tout près des brisants.`,
        choices: [
          {
            id: 'allumer',
            text: 'Remplir la lampe et l’allumer',
            to: 'lumiere',
            condition: 'has huile and has briquet',
            lockedHint: 'Sans huile ni briquet, la lampe restera morte.',
          },
          {
            id: 'amulette',
            text: "Poser l'amulette au cœur de la lentille",
            to: 'deux-mondes',
            condition: 'has amulette',
            locked: 'hide',
          },
          { id: 'redescendre', text: 'Redescendre chercher de quoi l’allumer', to: 'descente' },
        ],
      },
      {
        id: 'descente',
        title: 'Contre la montre',
        onEnter: [{ kind: 'add', var: 'endurance', value: '-2' }],
        text: `Vous dévalez les cent vingt marches, le cœur au bord des lèvres. Chaque seconde compte. Vos jambes brûlent.

Endurance : **{{endurance}}**.`,
        choices: [{ id: 'cabane', text: 'Foncer à la cabane du gardien', to: 'cabane' }],
      },
      {
        id: 'lumiere',
        title: 'La lumière retrouvée',
        ending: { kind: 'victory', title: 'La lumière retrouvée' },
        text: `La mèche s'embrase. La lentille capte la flamme, la multiplie, la projette : un faisceau blanc déchire la brume et balaie la baie.

En bas, le trois-mâts vire de bord dans un grand fracas de voiles. Il passe à une encablure des récifs. Des cris de joie montent jusqu'à vous.

À l'aube, on retrouve le vieux Yann endormi dans une grotte, sain et sauf, incapable de se souvenir de rien.

Ker-Ys a de nouveau un gardien. Et ce gardien, c'est vous.`,
      },
      {
        id: 'deux-mondes',
        title: 'Le phare des deux mondes',
        ending: { kind: 'secret', title: 'Le phare des deux mondes' },
        onEnter: [{ kind: 'unlock', achievement: 'gardien_des_mondes' }],
        text: `L'amulette épouse parfaitement le creux de la lentille, comme si elle avait été taillée pour elle. Une lumière **bleue** jaillit — pas vers le large, mais vers le fond de la mer.

Sous les vagues, la brume se déchire et vous la voyez : **Ys**, la ville engloutie. Ses tours, ses places, ses habitants qui lèvent les yeux vers vous. La voix dans la brume n'était pas un monstre. C'était un appel.

Le navire, guidé par ce double faisceau, passe au large sans une égratignure.

Désormais, votre phare veille sur deux mondes. Et chaque nuit, quelqu'un, en bas, vous fait signe.`,
      },
      {
        id: 'noyade',
        title: 'Emportée par la brume',
        ending: { kind: 'death', title: 'Emportée par la brume' },
        text: `L'eau est froide, puis elle ne l'est plus. La voix vous berce. Au-dessus de vous, la surface s'éloigne, argentée, lointaine.

Cette nuit-là, le navire s'est brisé sur les récifs de Ker-Ys.

Et depuis, les soirs de brume, les pêcheurs jurent qu'une nouvelle voix se mêle aux autres. Une voix jeune, qui appelle les passants par leur prénom.`,
      },
      {
        id: 'epuisement',
        title: 'À bout de forces',
        ending: { kind: 'death', title: 'À bout de forces' },
        text: `Vos jambes se dérobent. Vous tombez à genoux sur la pierre mouillée, incapable de faire un pas de plus.

La brume vous recouvre doucement, comme un drap. Le dernier son que vous entendez est la corne du navire — puis le fracas du bois contre les rochers.`,
      },
      {
        id: 'renoncement',
        title: 'Le renoncement',
        ending: { kind: 'neutral', title: 'Le renoncement' },
        text: `Vous reprenez les rames. La peur est plus forte que tout.

Au matin, les nouvelles arrivent au port : un trois-mâts s'est échoué sur les récifs de Ker-Ys. Par miracle, l'équipage a survécu.

Personne ne vous reproche rien. Mais chaque nuit, vous regardez le phare éteint, et vous vous demandez ce qui vous attendait là-haut.`,
      },
    ],
  },
};
