import { EndingKindSchema, SaveDataSchema, StorySchema } from '@dedale/engine';
import { z } from 'zod';
import { IsoDateSchema, SlugSchema, UuidSchema } from '../domain';
import { AuthorRefSchema, StoryCardSchema } from './catalog';

export const SaveSlotSchema = z.enum(['auto', '1', '2', '3']);
export type SaveSlot = z.infer<typeof SaveSlotSchema>;

export const SaveRecordSchema = z.object({
  id: UuidSchema,
  storyId: UuidSchema,
  versionId: UuidSchema,
  slot: SaveSlotSchema,
  data: SaveDataSchema,
  passageId: z.string(),
  passageTitle: z.string(),
  status: z.enum(['playing', 'ended']),
  endingPassageId: z.string().nullable(),
  updatedAt: IsoDateSchema,
});
export type SaveRecord = z.infer<typeof SaveRecordSchema>;

/** Tout ce qu'il faut pour lire, y compris hors ligne. */
export const ReadingPackageSchema = z.object({
  storyId: UuidSchema,
  slug: SlugSchema,
  title: z.string(),
  coverUrl: z.string().nullable(),
  author: AuthorRefSchema,
  version: z.object({ id: UuidSchema, number: z.number().int(), publishedAt: IsoDateSchema }),
  document: StorySchema,
  saves: z.array(SaveRecordSchema),
  discoveredEndings: z.array(z.string()),
});
export type ReadingPackage = z.infer<typeof ReadingPackageSchema>;

export const OpenStoryInputSchema = z.object({ slug: SlugSchema });

export const UpsertSaveInputSchema = z.object({
  storyId: UuidSchema,
  versionId: UuidSchema,
  slot: SaveSlotSchema,
  data: SaveDataSchema,
});

export const DeleteSaveInputSchema = z.object({ storyId: UuidSchema, slot: SaveSlotSchema });

/** Événements de lecture anonymisés, agrégés en statistiques communautaires. */
export const ReadingEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start') }),
  z.object({ type: z.literal('choice'), passage: z.string().max(64), choice: z.string().max(64) }),
  z.object({ type: z.literal('passage'), passage: z.string().max(64) }),
  z.object({ type: z.literal('ending'), passage: z.string().max(64) }),
]);
export type ReadingEvent = z.infer<typeof ReadingEventSchema>;

export const TrackInputSchema = z.object({
  storyId: UuidSchema,
  versionId: UuidSchema,
  events: z.array(ReadingEventSchema).min(1).max(50),
});

export const ChoiceStatsInputSchema = z.object({
  storyId: UuidSchema,
  passageId: z.string().max(64),
});
export const ChoiceStatsSchema = z.object({
  total: z.number().int(),
  choices: z.array(z.object({ choiceId: z.string(), count: z.number().int(), share: z.number() })),
});
export type ChoiceStats = z.infer<typeof ChoiceStatsSchema>;

export const LibraryEntrySchema = z.object({
  story: StoryCardSchema,
  status: z.enum(['playing', 'ended']),
  passageTitle: z.string(),
  updatedAt: IsoDateSchema,
  endingsDiscovered: z.number().int(),
});

export const LibrarySchema = z.object({
  inProgress: z.array(LibraryEntrySchema),
  finished: z.array(LibraryEntrySchema),
  favorites: z.array(StoryCardSchema),
});
export type Library = z.infer<typeof LibrarySchema>;

export const EndingsCodexSchema = z.object({
  total: z.number().int(),
  endings: z.array(
    z.object({
      passageId: z.string(),
      kind: EndingKindSchema,
      title: z.string().nullable(),
      discoveredAt: IsoDateSchema.nullable(),
      /** Part des lecteurs ayant atteint cette fin. */
      rarity: z.number(),
    }),
  ),
});
export type EndingsCodex = z.infer<typeof EndingsCodexSchema>;
