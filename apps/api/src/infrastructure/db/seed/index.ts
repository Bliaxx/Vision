import type { StoryMeta } from '@dedale/contracts';
import {
  type Action,
  applyAction,
  compileStory,
  createGame,
  encounterActions,
  getView,
  nextFloat,
  replay,
  type Story,
  StorySchema,
  seedRng,
  toSaveData,
} from '@dedale/engine';
import { sampleAuthors, sampleStories } from '@dedale/samples';
import { eq, sql } from 'drizzle-orm';
import { loadEnv } from '../../../config';
import { createContainer } from '../../../container';
import type { Viewer } from '../../../http/context';
import {
  ReadingRepository,
  type StatIncrements,
} from '../../../modules/reading/reading.repository';
import { runMigrations } from '../migrate';
import { collections, feedback, reports, stories, subscriptions, user } from '../schema';

export const DEMO_PASSWORD = 'dedale-demo-2026';

const READERS = [
  { name: 'Camille Laurent', email: 'camille@demo.dedale.app', plan: 'explorer' as const },
  { name: 'Jules Roux', email: 'jules@demo.dedale.app', plan: 'wanderer' as const },
  { name: 'Sarah Nguyen', email: 'sarah@demo.dedale.app', plan: 'family' as const },
  { name: 'Nora Haddad', email: 'nora@demo.dedale.app', plan: 'wanderer' as const },
];

const REVIEWS: Record<
  string,
  { reader: number; rating: number; body: string; spoiler?: boolean }[]
> = {
  'le-phare-des-brumes': [
    {
      reader: 0,
      rating: 5,
      body: "J'ai grandi avec les livres-jeux et je retrouve exactement ce frisson. Le combat dans l'escalier m'a fait lancer les dés trois fois !",
    },
    {
      reader: 1,
      rating: 5,
      body: 'La fin secrète est magnifique. Allez fouiller les rochers.',
      spoiler: true,
    },
    {
      reader: 2,
      rating: 4,
      body: 'Lu avec ma fille de 11 ans, elle a adoré la voix dans la brume (un peu moins la noyade…).',
    },
  ],
  'nuit-blanche-a-montmartre': [
    {
      reader: 0,
      rating: 5,
      body: 'Une vraie enquête où il faut réfléchir. Atmosphère Paris années 20 parfaitement rendue.',
    },
    {
      reader: 3,
      rating: 4,
      body: "Je me suis fait arrêter deux fois avant de comprendre qu'il fallait prendre des risques. Génial.",
    },
  ],
  'le-jardin-de-mila': [
    {
      reader: 2,
      rating: 5,
      body: 'Notre histoire du soir préférée. Mon fils veut toujours planter la graine de lune.',
    },
    { reader: 3, rating: 5, body: 'Tout en douceur, idéal pour les petits lecteurs.' },
  ],
  signal: [
    { reader: 1, rating: 4, body: 'Short, tense and clever. The twist got me.' },
    { reader: 0, rating: 5, body: 'Court mais mémorable, la fin en boucle est brillante.' },
  ],
  'la-derniere-lettre': [{ reader: 2, rating: 5, body: 'J’ai pleuré. Merci pour ce texte.' }],
};

/** Joue une partie au hasard ; renvoie les événements anonymes produits. */
function randomPlaythrough(story: ReturnType<typeof compileStory>, seed: number) {
  let rng = seedRng(seed * 31 + 7);
  const pick = (n: number) => {
    const [value, next] = nextFloat(rng);
    rng = next;
    return Math.floor(value * n);
  };
  let { state } = createGame(story, seed);
  const actions: Action[] = [];
  const events: { choices: [string, string][]; passages: string[]; ending: string | null } = {
    choices: [],
    passages: [state.passage],
    ending: null,
  };
  // Les lecteurs abandonnent parfois en cours de route.
  const patience = 4 + pick(40);
  while (state.status === 'playing' && state.step < patience) {
    const combat = encounterActions(story, state);
    let action: Action | null = null;
    if (combat.attack) action = { type: 'attack' };
    else {
      const available = getView(story, state).choices.filter((choice) => choice.available);
      // Biais humain : le premier choix est plus souvent pris.
      const index = available.length > 1 && pick(3) === 0 ? 0 : pick(available.length);
      const choice = available[index];
      if (choice) {
        action = { type: 'choose', choice: choice.id };
        events.choices.push([state.passage, choice.id]);
      }
    }
    if (!action) break;
    actions.push(action);
    state = applyAction(story, state, action).state;
    events.passages.push(state.passage);
  }
  if (state.ending) events.ending = state.ending.passage;
  return { events, actions, state };
}

export async function seed(options: { reset: boolean }) {
  const env = loadEnv();
  await runMigrations(env.DATABASE_URL);
  const container = createContainer(env, {});
  const { db } = container.database;
  const { services, auth, logger } = container;

  if (options.reset) {
    await db.execute(sql`truncate table "user", stories, collections restart identity cascade`);
  } else {
    const [existing] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, 'admin@demo.dedale.app'));
    if (existing) {
      logger.info('données de démonstration déjà présentes (utilisez --reset pour réinitialiser)');
      await container.database.close();
      return;
    }
  }

  const signUp = async (name: string, email: string): Promise<Viewer> => {
    const result = await auth.api.signUpEmail({ body: { name, email, password: DEMO_PASSWORD } });
    const viewer = await services.account.resolveViewer(result.user.id);
    if (!viewer) throw new Error(`compte introuvable : ${email}`);
    return viewer;
  };

  // --- Comptes -----------------------------------------------------------------
  const admin = await signUp('Équipe Dédale', 'admin@demo.dedale.app');
  await db.update(user).set({ role: 'admin' }).where(eq(user.id, admin.id));
  await services.account.updateProfile(admin, {
    handle: 'dedale',
    bio: "Le compte officiel de l'équipe éditoriale de Dédale.",
  });

  const authors = new Map<string, Viewer>();
  for (const author of sampleAuthors) {
    const viewer = await signUp(author.name, author.email);
    await services.account.updateProfile(viewer, { handle: author.handle, bio: author.bio });
    authors.set(author.key, viewer);
  }

  const readers: Viewer[] = [];
  for (const reader of READERS) {
    const viewer = await signUp(reader.name, reader.email);
    await db
      .update(subscriptions)
      .set({
        plan: reader.plan,
        status: 'active',
        provider: 'manual',
        interval: reader.plan === 'wanderer' ? null : 'year',
        currentPeriodEnd:
          reader.plan === 'wanderer' ? null : new Date(Date.now() + 300 * 86_400_000),
      })
      .where(eq(subscriptions.userId, viewer.id));
    readers.push((await services.account.resolveViewer(viewer.id)) as Viewer);
  }
  // Les auteurs profitent de l'offre Architecte (Muse, statistiques avancées).
  for (const viewer of authors.values()) {
    await db
      .update(subscriptions)
      .set({
        plan: 'architect',
        provider: 'manual',
        interval: 'year',
        currentPeriodEnd: new Date(Date.now() + 300 * 86_400_000),
      })
      .where(eq(subscriptions.userId, viewer.id));
  }

  // --- Récits --------------------------------------------------------------------
  const reading = new ReadingRepository(db);
  const published = new Map<string, { id: string; story: Story }>();
  for (const [index, sample] of sampleStories.entries()) {
    const author = (await services.account.resolveViewer(
      (authors.get(sample.author) as Viewer).id,
    )) as Viewer;
    const document = StorySchema.parse(sample.document);
    const [row] = await db
      .insert(stories)
      .values({
        authorId: author.id,
        slug: sample.slug,
        title: document.title,
        language: document.language,
        genres: [...sample.meta.genres],
        draft: document,
      })
      .returning({ id: stories.id });
    const id = (row as { id: string }).id;
    const meta: StoryMeta = {
      title: document.title,
      tagline: sample.meta.tagline,
      synopsis: sample.meta.synopsis,
      language: document.language,
      genres: [...sample.meta.genres] as StoryMeta['genres'],
      tags: [...sample.meta.tags],
      ageRating: sample.meta.ageRating,
      contentWarnings: [...sample.meta.contentWarnings] as StoryMeta['contentWarnings'],
      access: sample.meta.access,
      priceCents: sample.meta.priceCents,
      license: sample.meta.license as StoryMeta['license'],
      aiUsage: 'none',
      coverUrl: null,
    };
    await services.authoring.updateMeta(author, id, meta);
    await services.authoring.publish(author, {
      id,
      visibility: 'public',
      changelog: 'Première édition',
    });
    // Échelonne les dates de publication pour un catalogue crédible.
    await db
      .update(stories)
      .set({ firstPublishedAt: new Date(Date.now() - (index * 9 + 3) * 86_400_000) })
      .where(eq(stories.id, id));
    published.set(sample.slug, { id, story: document });

    // Parties simulées → statistiques communautaires réalistes.
    const compiled = compileStory(document);
    const plays = [260, 180, 140, 120, 60][index] ?? 50;
    const increments: StatIncrements = {
      starts: 0,
      completions: 0,
      passages: new Map(),
      choices: new Map(),
      endings: new Map(),
    };
    for (let play = 0; play < plays; play++) {
      const { events } = randomPlaythrough(compiled, play + 1);
      increments.starts++;
      for (const passage of events.passages)
        increments.passages.set(passage, (increments.passages.get(passage) ?? 0) + 1);
      for (const [passageId, choiceId] of events.choices) {
        const key = `${passageId}/${choiceId}`;
        const current = increments.choices.get(key);
        increments.choices.set(key, { passageId, choiceId, count: (current?.count ?? 0) + 1 });
      }
      if (events.ending) {
        increments.completions++;
        increments.endings.set(events.ending, (increments.endings.get(events.ending) ?? 0) + 1);
      }
    }
    await reading.applyStats(id, increments);
  }

  // --- Avis ------------------------------------------------------------------------
  for (const [slug, entries] of Object.entries(REVIEWS)) {
    const target = published.get(slug);
    if (!target) continue;
    for (const entry of entries) {
      await services.community.upsertReview(readers[entry.reader] as Viewer, {
        storyId: target.id,
        rating: entry.rating,
        body: entry.body,
        spoiler: entry.spoiler ?? false,
      });
    }
  }

  // --- Bibliothèque de Camille ------------------------------------------------------
  const camille = readers[0] as Viewer;
  const camilleRuns: { slug: string; seed: number; choices: string[] }[] = [
    // Une partie en cours dans le Phare (objets ramassés, carnet lu).
    { slug: 'le-phare-des-brumes', seed: 42, choices: ['cabane', 'prendre', 'carnet', 'retour'] },
    // Une partie terminée dans le Jardin, fin secrète comprise.
    {
      slug: 'le-jardin-de-mila',
      seed: 7,
      choices: [
        'mamie',
        'entrer',
        'tournesols',
        'retour',
        'gaston',
        'fleurs',
        'arroser',
        'gaston',
        'fleurs',
        'chanter',
        'gaston',
        'jardin',
        'mare',
        'graine',
        'gaston',
        'donner',
        'planter',
      ],
    },
  ];
  for (const run of camilleRuns) {
    const target = published.get(run.slug);
    if (!target) continue;
    const compiled = compileStory(target.story);
    const session = replay(
      compiled,
      run.seed,
      run.choices.map((choice) => ({ type: 'choose', choice })),
    );
    const [version] = await db
      .select({ id: stories.publishedVersionId })
      .from(stories)
      .where(eq(stories.id, target.id));
    await services.reading.saveProgress(camille, {
      storyId: target.id,
      versionId: version?.id as string,
      slot: 'auto',
      data: toSaveData(session),
    });
  }
  const phare = published.get('le-phare-des-brumes');
  const nuit = published.get('nuit-blanche-a-montmartre');
  if (phare) await services.community.toggleFavorite(camille, phare.id);
  await services.community.toggleFollow(camille, 'aurore_delsol');

  // --- Sélection éditoriale, retours et modération -----------------------------------
  const picks = ['le-phare-des-brumes', 'nuit-blanche-a-montmartre', 'signal', 'le-jardin-de-mila']
    .map((slug) => published.get(slug)?.id)
    .filter((id): id is string => id !== undefined);
  await db.insert(collections).values({
    slug: 'selection-equipe',
    title: "La sélection de l'équipe",
    description: 'Nos coups de cœur du moment.',
    storyIds: picks,
    featured: true,
  });

  if (phare) {
    await db.insert(feedback).values([
      {
        storyId: phare.id,
        passageId: 'carnet',
        userId: readers[1]?.id ?? null,
        kind: 'typo',
        body: '« tremblée » : on dirait plutôt « tremblante » ?',
      },
      {
        storyId: phare.id,
        passageId: 'lanterne',
        userId: readers[2]?.id ?? null,
        kind: 'praise',
        body: 'Le moment où l’amulette devient brûlante : frissons garantis !',
      },
    ]);
  }
  if (nuit) {
    await db.insert(reports).values({
      reporterId: readers[3]?.id ?? null,
      targetType: 'story',
      targetId: nuit.id,
      reason: 'violence',
      details: 'Signalement de démonstration : vérifier la classification 13+.',
    });
  }

  logger.info(
    {
      comptes: 1 + authors.size + readers.length,
      recits: published.size,
      motDePasse: DEMO_PASSWORD,
    },
    '✓ données de démonstration créées',
  );
  await container.database.close();
}
