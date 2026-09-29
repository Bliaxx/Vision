import { serve } from '@hono/node-server';
import { createApp } from './app';
import { loadEnv } from './config';
import { createContainer } from './container';

const env = loadEnv();
const container = createContainer(env);
const { app } = createApp(container);

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  container.logger.info(
    { port: info.port, payments: container.adapters.payments, muse: container.adapters.muse },
    `API Dédale prête sur http://localhost:${info.port} — docs : /api/v1/docs`,
  );
});

/** Arrêt propre : on cesse d'accepter des connexions puis on ferme la base. */
async function shutdown(signal: string) {
  container.logger.info({ signal }, 'arrêt en cours');
  server.close();
  await container.database.close();
  process.exit(0);
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
