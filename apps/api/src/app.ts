import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins';
import { ORPCError, onError } from '@orpc/server';
import { RPCHandler } from '@orpc/server/fetch';
import { sql } from 'drizzle-orm';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import type { Container } from './container';
import type { RequestContext, Viewer } from './http/context';
import { openApiInfo, schemaConverters } from './http/openapi';
import { createRouter } from './http/router';

type AppEnv = { Variables: { requestId: string } };

function clientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown'
  );
}

/**
 * Application HTTP. Hono fournit le socle (middlewares, routage), oRPC sert
 * le contrat sous deux protocoles :
 * - `/api/rpc`  : protocole RPC typé, utilisé par le web et le mobile ;
 * - `/api/v1`   : REST + OpenAPI pour les partenaires (docs sur `/api/v1/docs`).
 */
export function createApp(container: Container) {
  const { env, logger, auth, services } = container;
  const router = createRouter(services);
  const trustedOrigins = new Set([
    env.WEB_URL,
    ...env.TRUSTED_ORIGINS.split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  ]);

  const logUnexpected = (error: unknown) => {
    if (error instanceof ORPCError && error.status < 500) return;
    logger.error({ err: error }, 'erreur inattendue');
  };
  const rpc = new RPCHandler(router, { interceptors: [onError(logUnexpected)] });
  const rest = new OpenAPIHandler(router, {
    interceptors: [onError(logUnexpected)],
    plugins: [
      new OpenAPIReferencePlugin({
        schemaConverters,
        docsTitle: 'API Dédale',
        specPath: '/openapi.json',
        docsPath: '/docs',
        specGenerateOptions: { info: openApiInfo, servers: [{ url: `${env.API_URL}/api/v1` }] },
      }),
    ],
  });

  const createContext = (headers: Headers, id: string): RequestContext => {
    let viewer: Promise<Viewer | null> | undefined;
    return {
      requestId: id,
      ip: clientIp(headers),
      headers,
      locale: headers.get('accept-language')?.toLowerCase().startsWith('en') ? 'en' : 'fr',
      viewer: () => {
        viewer ??= auth.api
          .getSession({ headers })
          .then((session) => (session ? services.account.resolveViewer(session.user.id) : null));
        return viewer;
      },
    };
  };

  const app = new Hono<AppEnv>();

  app.use(requestId());
  app.use(async (c, next) => {
    const started = performance.now();
    await next();
    logger.info(
      {
        id: c.get('requestId'),
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        ms: Math.round(performance.now() - started),
      },
      'requête',
    );
  });
  app.use(secureHeaders({ crossOriginResourcePolicy: 'same-site' }));
  app.use(
    '/api/*',
    cors({
      origin: (origin) => (trustedOrigins.has(origin) ? origin : null),
      credentials: true,
      allowHeaders: ['content-type', 'authorization', 'accept-language'],
      allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      maxAge: 600,
    }),
  );
  app.use('/api/*', bodyLimit({ maxSize: 4 * 1024 * 1024 }));

  // Protection CSRF : une requête d'écriture authentifiée par cookie doit venir d'une origine de confiance.
  app.use('/api/*', async (c, next) => {
    const method = c.req.method;
    const origin = c.req.header('origin');
    if (
      method !== 'GET' &&
      method !== 'HEAD' &&
      method !== 'OPTIONS' &&
      origin &&
      c.req.header('cookie')
    ) {
      if (!trustedOrigins.has(origin) && !c.req.path.startsWith('/api/auth')) {
        return c.json({ code: 'FORBIDDEN', message: 'origine non autorisée' }, 403);
      }
    }
    return next();
  });

  app.get('/health', (c) => c.json({ status: 'ok' }));
  app.get('/ready', async (c) => {
    try {
      await container.database.db.execute(sql`select 1`);
      return c.json({ status: 'ready', adapters: container.adapters });
    } catch {
      return c.json({ status: 'unavailable' }, 503);
    }
  });

  app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

  app.post('/api/webhooks/stripe', async (c) => {
    try {
      await services.billing.handleWebhook(
        await c.req.text(),
        c.req.header('stripe-signature') ?? null,
      );
      return c.json({ received: true });
    } catch (error) {
      logger.warn({ err: error }, 'webhook Stripe rejeté');
      return c.json({ received: false }, 400);
    }
  });

  app.use('/api/rpc/*', async (c, next) => {
    const { matched, response } = await rpc.handle(c.req.raw, {
      prefix: '/api/rpc',
      context: createContext(c.req.raw.headers, c.get('requestId')),
    });
    if (matched) return c.newResponse(response.body, response);
    return next();
  });

  app.use('/api/v1/*', async (c, next) => {
    const { matched, response } = await rest.handle(c.req.raw, {
      prefix: '/api/v1',
      context: createContext(c.req.raw.headers, c.get('requestId')),
    });
    if (matched) return c.newResponse(response.body, response);
    return next();
  });

  app.notFound((c) => c.json({ code: 'NOT_FOUND', message: 'route inconnue' }, 404));
  app.onError((error, c) => {
    logger.error({ err: error, id: c.get('requestId') }, 'erreur HTTP');
    return c.json({ code: 'INTERNAL_SERVER_ERROR', message: 'erreur interne' }, 500);
  });

  return { app, router };
}
