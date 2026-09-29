import { readingSizes } from '@dedale/tokens';
import { useSyncExternalStore } from 'react';
import { z } from 'zod';
import { kv } from './kv';

const KEY = 'prefs:app';

const PreferencesSchema = z.object({
  /** Thème de l'interface (le thème de lecture est réglé à part). */
  appearance: z.enum(['system', 'light', 'dark']).default('system'),
  readerTheme: z.enum(['paper', 'sepia', 'night', 'contrast']).default('paper'),
  readerFont: z.enum(['reading', 'accessible', 'dyslexia']).default('reading'),
  readerSize: z
    .number()
    .refine((size) => (readingSizes as readonly number[]).includes(size))
    .default(20),
  haptics: z.boolean().default(true),
});
export type Preferences = z.infer<typeof PreferencesSchema>;

const DEFAULTS: Preferences = PreferencesSchema.parse({});
let cache: Preferences | null = null;

function snapshot(): Preferences {
  cache ??= kv.read(KEY, PreferencesSchema) ?? DEFAULTS;
  return cache;
}

export function updatePreferences(patch: Partial<Preferences>): void {
  cache = { ...snapshot(), ...patch };
  kv.write(KEY, cache);
}

/** Préférences persistantes, relues de façon synchrone (aucun flash au démarrage). */
export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (listener) => kv.subscribe(KEY, listener),
    snapshot,
    () => DEFAULTS,
  );
}
