import { defineConfig } from 'tsdown';

/**
 * Bundle de production autonome : code interne et dépendances npm sont
 * intégrés, l'image d'exécution n'a besoin que de Node.js (pas de node_modules).
 * Seul `pino-pretty` (confort de développement) reste externe.
 */
export default defineConfig({
  entry: {
    main: 'src/main.ts',
    migrate: 'src/cli/migrate.ts',
    seed: 'src/cli/seed.ts',
  },
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: [/^(?!pino-pretty$)/],
  external: ['pino-pretty'],
});
