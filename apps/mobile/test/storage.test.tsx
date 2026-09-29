import { renderHook } from '@testing-library/react-native';
import Storage from 'expo-sqlite/kv-store';
import { readOffline, removeOffline, saveOffline, useOfflineQuota } from '@/lib/offline';
import { readLocalSave, writeLocalSave } from '@/lib/saves';
import { resetStorage, samplePackage } from './helpers';

// Le module réseau est simulé (jest.mock est remonté avant les imports).
jest.mock('@/lib/api', () => ({ api: { reading: { open: jest.fn() } } }));

beforeEach(() => resetStorage());

describe('bibliothèque hors ligne', () => {
  it("garde un livre sur l'appareil, sans les sauvegardes du compte", () => {
    const pkg = { ...samplePackage(), saves: [] };
    saveOffline(pkg);
    const stored = readOffline(pkg.slug);
    expect(stored?.document.start).toBe(pkg.document.start);
    expect(stored?.saves).toEqual([]);
    removeOffline(pkg.slug);
    expect(readOffline(pkg.slug)).toBeNull();
  });

  it('ignore une copie corrompue au lieu de planter', () => {
    Storage.setItemSync('offline:casse', '{"slug":"casse"');
    expect(readOffline('casse')).toBeNull();
    Storage.setItemSync('offline:ancien', JSON.stringify({ slug: 'ancien', format: 0 }));
    expect(readOffline('ancien')).toBeNull();
  });
});

describe('quota hors ligne', () => {
  it("limite l'offre gratuite à 3 livres, sans limite pour Explorateur", async () => {
    for (const slug of ['a', 'b', 'c']) saveOffline({ ...samplePackage(), slug });
    const free = await renderHook(() => useOfflineQuota('wanderer'));
    expect(free.result.current).toMatchObject({ used: 3, limit: 3, full: true });
    const explorer = await renderHook(() => useOfflineQuota('explorer'));
    expect(explorer.result.current.full).toBe(false);
  });
});

describe('parties locales', () => {
  it('relit une sauvegarde valide et rejette une sauvegarde invalide', () => {
    const save = {
      versionId: 'v1',
      data: { v: 1 as const, seed: 4, actions: [] },
      passageTitle: 'La grève',
      updatedAt: '2026-09-01T00:00:00Z',
    };
    writeLocalSave('s1', save);
    expect(readLocalSave('s1')).toEqual(save);
    Storage.setItemSync('save:s2', JSON.stringify({ ...save, data: { v: 9 } }));
    expect(readLocalSave('s2')).toBeNull();
  });
});
