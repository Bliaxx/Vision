import { type ReadingPackage, ReadingPackageSchema } from '@dedale/contracts';
import { useSyncExternalStore } from 'react';
import { api } from './api';
import { kv } from './kv';

/**
 * Bibliothèque hors ligne : le « paquet de lecture » (récit complet + édition)
 * est gardé sur l'appareil. Le moteur tournant en local, un livre téléchargé
 * se lit entièrement sans réseau.
 */
const PREFIX = 'offline:';
const keyOf = (slug: string) => `${PREFIX}${slug}`;

export function readOffline(slug: string): ReadingPackage | null {
  return kv.read(keyOf(slug), ReadingPackageSchema);
}

export function saveOffline(pkg: ReadingPackage): void {
  // Les sauvegardes serveur ne sont pas figées dans le paquet : elles vivent à part.
  kv.write(keyOf(pkg.slug), { ...pkg, saves: [] });
}

export async function downloadStory(slug: string): Promise<ReadingPackage> {
  const pkg = await api.reading.open({ slug });
  saveOffline(pkg);
  return pkg;
}

export function removeOffline(slug: string): void {
  kv.remove(keyOf(slug));
}

export interface OfflineEntry {
  readonly slug: string;
  readonly title: string;
  readonly author: string;
  readonly coverUrl: string | null;
  readonly version: number;
}

let cache: readonly OfflineEntry[] | null = null;
kv.subscribe(PREFIX, () => {
  cache = null;
});

function snapshot(): readonly OfflineEntry[] {
  cache ??= kv
    .keys(PREFIX)
    .map((key) => readOffline(key.slice(PREFIX.length)))
    .filter((pkg) => pkg !== null)
    .map((pkg) => ({
      slug: pkg.slug,
      title: pkg.title,
      author: pkg.author.displayName,
      coverUrl: pkg.coverUrl,
      version: pkg.version.number,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
  return cache;
}

const EMPTY: readonly OfflineEntry[] = [];

export function useOfflineLibrary(): readonly OfflineEntry[] {
  return useSyncExternalStore(
    (listener) => kv.subscribe(PREFIX, listener),
    snapshot,
    () => EMPTY,
  );
}

export function useIsOffline(slug: string): boolean {
  return useOfflineLibrary().some((entry) => entry.slug === slug);
}
