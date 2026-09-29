import Storage from 'expo-sqlite/kv-store';
import type { z } from 'zod';

/**
 * Stockage clé-valeur persistant (SQLite), synchrone pour les lectures au
 * rendu. Chaque valeur relue est validée : un stockage corrompu ou une
 * ancienne version de l'app ne doivent jamais faire planter la lecture.
 */
type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function notify(key: string) {
  for (const [prefix, set] of listeners)
    if (key.startsWith(prefix)) for (const listener of set) listener();
}

export const kv = {
  read<T>(key: string, schema: z.ZodType<T>): T | null {
    try {
      const raw = Storage.getItemSync(key);
      if (raw === null) return null;
      const parsed = schema.safeParse(JSON.parse(raw));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  },
  write(key: string, value: unknown): void {
    Storage.setItemSync(key, JSON.stringify(value));
    notify(key);
  },
  remove(key: string): void {
    Storage.removeItemSync(key);
    notify(key);
  },
  keys(prefix: string): string[] {
    return Storage.getAllKeysSync().filter((key) => key.startsWith(prefix));
  },
  /** Abonnement aux écritures sous un préfixe (pour `useSyncExternalStore`). */
  subscribe(prefix: string, listener: Listener): () => void {
    const set = listeners.get(prefix) ?? new Set();
    set.add(listener);
    listeners.set(prefix, set);
    return () => set.delete(listener);
  },
};
