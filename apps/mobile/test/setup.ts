/**
 * Environnement de test : stockage SQLite simulé en mémoire, zones sûres et
 * animations neutralisées. Les modules natifs Expo sont simulés par jest-expo.
 */
jest.mock('expo-sqlite/kv-store', () => {
  const store = new Map<string, string>();
  const storage = {
    getItemSync: (key: string) => store.get(key) ?? null,
    setItemSync: (key: string, value: string) => void store.set(key, value),
    removeItemSync: (key: string) => store.delete(key),
    getAllKeysSync: () => [...store.keys()],
    clear: () => store.clear(),
  };
  return { __esModule: true, default: storage, Storage: storage };
});

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
