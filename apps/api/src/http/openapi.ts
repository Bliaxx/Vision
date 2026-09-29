import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';

export const openApiInfo = {
  title: 'API Dédale',
  version: '1.0.0',
  description:
    'API publique de Dédale, la plateforme des histoires dont vous tenez le fil. Le catalogue est accessible sans authentification ; les autres routes utilisent la session (cookie) ou un jeton porteur.',
  contact: { name: 'Équipe Dédale', url: 'https://dedale.app' },
  license: { name: 'Propriétaire' },
};

export const schemaConverters = [new ZodToJsonSchemaConverter()];

export function createOpenApiGenerator() {
  return new OpenAPIGenerator({ schemaConverters });
}
