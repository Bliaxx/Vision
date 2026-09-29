import { defineConfig } from 'tsdown';

/**
 * Bundle de production : les paquets internes (@dedale/*) sont intégrés, les
 * dépendances npm restent externes (installées dans l'image Docker).
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
  noExternal: [/^@dedale\//],
});
