const expoPreset = require('jest-expo/jest-preset');

// Le transformateur Babel d'Expo, appliqué aussi aux modules ESM publiés en `.mjs`.
const babelTransform = expoPreset.transform['\\.[jt]sx?$'];

/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  roots: ['<rootDir>/test'],
  setupFiles: ['<rootDir>/test/setup.ts'],
  transform: { '\\.mjs$': babelTransform },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Jest ne lit pas le build ESM (.mjs) : on vise la version CommonJS.
    '^lucide-react-native$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/lucide-react-native.js',
  },
  // pnpm range les paquets dans node_modules/.pnpm : on transpile aussi ceux
  // de React Native, d'Expo, les paquets internes livrés en TypeScript et les
  // dépendances publiées uniquement en ESM.
  transformIgnorePatterns: [
    'node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:(?:jest-)?react-native|@react-native(?:-community)?|expo(?:nent)?|@expo(?:nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@dedale/.*|lucide-react-native|use-intl|@formatjs/.*|intl-messageformat|standard-navigation|@orpc/.*|@tanstack/.*|better-auth|@better-auth/.*))',
  ],
};
