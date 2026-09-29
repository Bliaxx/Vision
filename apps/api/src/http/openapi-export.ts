import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contract } from '@dedale/contracts';
import { createOpenApiGenerator, openApiInfo } from './openapi';

/** Exporte la spécification OpenAPI du contrat (documentation, SDK partenaires). */
const spec = await createOpenApiGenerator().generate(contract, {
  info: openApiInfo,
  servers: [{ url: 'https://api.dedale.app/api/v1' }],
});
const out = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../docs/api/openapi.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`✓ ${out}`);
