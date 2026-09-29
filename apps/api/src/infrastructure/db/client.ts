import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export type Database = PostgresJsDatabase<typeof schema>;
/** Transaction ou connexion : les dépôts acceptent l'un ou l'autre. */
export type Executor = Pick<
  Database,
  'select' | 'insert' | 'update' | 'delete' | 'execute' | 'query'
>;

export interface DatabaseHandle {
  readonly db: Database;
  close(): Promise<void>;
}

export function createDatabase(url: string, options: { poolSize?: number } = {}): DatabaseHandle {
  const client = postgres(url, {
    max: options.poolSize ?? 10,
    onnotice: () => {},
    connection: { application_name: 'dedale-api' },
  });
  const db = drizzle(client, { schema, casing: 'snake_case' });
  return { db, close: () => client.end({ timeout: 5 }) };
}

export { schema };
