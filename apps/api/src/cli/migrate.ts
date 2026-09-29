import { runMigrations } from '../infrastructure/db/migrate';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('DATABASE_URL manquant');
await runMigrations(url);
console.info('✓ migrations appliquées');
