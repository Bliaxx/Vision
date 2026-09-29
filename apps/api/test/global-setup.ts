import postgres from 'postgres';
import { runMigrations } from '../src/infrastructure/db/migrate';

export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://dedale:dedale@localhost:5432/dedale_test';

/** Repart d'un schéma vierge puis applique toutes les migrations. */
export default async function setup() {
  const sql = postgres(TEST_DATABASE_URL, { max: 1, onnotice: () => {} });
  await sql.unsafe(
    'drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;',
  );
  await sql.end();
  await runMigrations(TEST_DATABASE_URL);
}
