import { SaveDataSchema } from '@dedale/engine';
import type { LocalSave } from '@dedale/play';
import { z } from 'zod';
import { kv } from './kv';

/** Parties en cours sur l'appareil (une par récit), validées à la relecture. */
const LocalSaveSchema = z.object({
  versionId: z.string(),
  data: SaveDataSchema,
  passageTitle: z.string(),
  updatedAt: z.string(),
  ended: z.boolean().optional(),
});

const keyOf = (storyId: string) => `save:${storyId}`;

export function readLocalSave(storyId: string): LocalSave | null {
  return kv.read(keyOf(storyId), LocalSaveSchema);
}

export function writeLocalSave(storyId: string, save: LocalSave): void {
  kv.write(keyOf(storyId), save);
}
