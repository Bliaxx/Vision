import { z } from 'zod';

const booleanish = z
  .enum(['true', 'false', '1', '0'])
  .transform((value) => value === 'true' || value === '1');

/**
 * Configuration validée au démarrage : l'API refuse de démarrer si une
 * variable est manquante ou invalide (échec rapide plutôt qu'en production).
 */
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  DATABASE_URL: z.url(),
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(100).default(10),
  /** URL publique de l'API (callbacks d'authentification, liens). */
  API_URL: z.url().default('http://localhost:4000'),
  /** URL publique du site web (redirections, CORS). */
  WEB_URL: z.url().default('http://localhost:3000'),
  /** Origines supplémentaires autorisées (séparées par des virgules). */
  TRUSTED_ORIGINS: z.string().default(''),
  AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  MUSE_MODEL: z.string().default('claude-opus-5-5'),
  /**
   * Instance de démonstration (docker compose, préproduction) : autorise le
   * prestataire de paiement simulé sur un build de production.
   */
  DEMO_MODE: booleanish.default(false),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().default(120),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Configuration invalide :\n${details}`);
  }
  return result.data;
}
