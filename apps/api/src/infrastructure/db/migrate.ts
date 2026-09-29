import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDatabase } from './client';

const here = dirname(fileURLToPath(import.meta.url));

/** Dossier des migrations : sources (`src/…`) ou bundle de production (`dist/`). */
export const MIGRATIONS_FOLDER =
  [process.env.MIGRATIONS_DIR, resolve(here, '../../../drizzle'), resolve(here, '../drizzle')].find(
    (candidate): candidate is string => candidate !== undefined && existsSync(candidate),
  ) ?? resolve(here, '../drizzle');

export async function runMigrations(url: string): Promise<void> {
  const handle = createDatabase(url, { poolSize: 1 });
  try {
    await migrate(handle.db, { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await handle.close();
  }
}
