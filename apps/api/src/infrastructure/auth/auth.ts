import { expo } from '@better-auth/expo';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Env } from '../../config';
import type { Database } from '../db/client';
import { account, session, user, verification } from '../db/schema';

export interface AuthHooks {
  /** Appelé après la création d'un compte (profil public, offre gratuite). */
  onUserCreated(user: { id: string; name: string; email: string }): Promise<void>;
}

/**
 * Authentification (Better Auth) : e-mail + mot de passe, fournisseurs OAuth
 * optionnels, sessions en cookie HTTP-only pour le web et jeton sécurisé
 * (SecureStore) pour l'application mobile via le plugin Expo.
 */
export function createAuth(env: Env, db: Database, hooks: AuthHooks) {
  const trustedOrigins = [
    env.WEB_URL,
    'dedale://',
    'exp://',
    ...env.TRUSTED_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
  ];

  return betterAuth({
    appName: 'Dédale',
    baseURL: env.API_URL,
    basePath: '/api/auth',
    secret: env.AUTH_SECRET,
    trustedOrigins,
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    socialProviders: {
      ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } }
        : {}),
      ...(env.APPLE_CLIENT_ID && env.APPLE_CLIENT_SECRET
        ? { apple: { clientId: env.APPLE_CLIENT_ID, clientSecret: env.APPLE_CLIENT_SECRET } }
        : {}),
    },
    user: {
      additionalFields: {
        role: { type: 'string', required: false, defaultValue: 'reader', input: false },
        locale: { type: 'string', required: false, defaultValue: 'fr' },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    rateLimit: { enabled: env.NODE_ENV === 'production', window: 60, max: 30 },
    advanced: {
      useSecureCookies: env.NODE_ENV === 'production',
      database: { generateId: () => crypto.randomUUID() },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (created) => {
            await hooks.onUserCreated({ id: created.id, name: created.name, email: created.email });
          },
        },
      },
    },
    plugins: [expo()],
  });
}

export type Auth = ReturnType<typeof createAuth>;
