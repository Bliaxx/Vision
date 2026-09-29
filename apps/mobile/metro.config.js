// Metro détecte le monorepo (dossiers de l'espace de travail pnpm) et sait
// transpiler les paquets internes livrés en TypeScript source.
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
