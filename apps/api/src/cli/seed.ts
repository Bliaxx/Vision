import { seed } from '../infrastructure/db/seed';

await seed({ reset: process.argv.includes('--reset') });
