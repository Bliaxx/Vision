import { sampleStories } from '@dedale/samples';
import { sql } from 'drizzle-orm';
import pino from 'pino';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config';
import { createContainer } from '../../src/container';
import { OfflineMuse } from '../../src/infrastructure/ai/offline-muse';
import { FakePaymentGateway } from '../../src/infrastructure/billing/fake-gateway';
import { user } from '../../src/infrastructure/db/schema';
import { TEST_DATABASE_URL } from '../global-setup';

export const WEB_ORIGIN = 'http://localhost:3000';

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
}

/** Client HTTP de test avec gestion des cookies de session. */
export class TestClient {
  private cookies = new Map<string, string>();

  constructor(private readonly app: ReturnType<typeof createApp>['app']) {}

  async request<T = any>(method: string, path: string, body?: unknown): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = { origin: WEB_ORIGIN };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (this.cookies.size > 0) {
      headers.cookie = [...this.cookies].map(([name, value]) => `${name}=${value}`).join('; ');
    }
    const response = await this.app.request(path, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    for (const cookie of response.headers.getSetCookie()) {
      const [pair] = cookie.split(';');
      const [name, ...value] = (pair ?? '').split('=');
      if (name) this.cookies.set(name.trim(), value.join('='));
    }
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
  }

  get = <T = any>(path: string) => this.request<T>('GET', path);
  post = <T = any>(path: string, body: unknown = {}) => this.request<T>('POST', path, body);
  put = <T = any>(path: string, body: unknown) => this.request<T>('PUT', path, body);
  patch = <T = any>(path: string, body: unknown) => this.request<T>('PATCH', path, body);
  delete = <T = any>(path: string) => this.request<T>('DELETE', path);

  async signUp(name: string, email: string, password = 'mot-de-passe-solide') {
    const response = await this.post('/api/auth/sign-up/email', { name, email, password });
    if (response.status !== 200)
      throw new Error(`inscription impossible : ${JSON.stringify(response.body)}`);
    return (response.body as { user: { id: string } }).user.id;
  }
}

export async function createHarness() {
  const env = loadEnv({
    NODE_ENV: 'test',
    DATABASE_URL: TEST_DATABASE_URL,
    AUTH_SECRET: 'secret-de-test-suffisamment-long-0123456789',
    API_URL: 'http://localhost:4000',
    WEB_URL: WEB_ORIGIN,
    LOG_LEVEL: 'silent',
  });
  const container = createContainer(env, {
    logger: pino({ level: 'silent' }),
    payments: new FakePaymentGateway(),
    muse: new OfflineMuse(),
  });
  const { app } = createApp(container);
  const { db } = container.database;

  return {
    app,
    container,
    db,
    client: () => new TestClient(app),
    async reset() {
      await db.execute(sql`truncate table "user", stories, collections restart identity cascade`);
    },
    async setRole(userId: string, role: 'reader' | 'author' | 'moderator' | 'admin') {
      await db.update(user).set({ role }).where(sql`${user.id} = ${userId}`);
    },
    close: () => container.database.close(),
  };
}

export type Harness = Awaited<ReturnType<typeof createHarness>>;

/** Crée et publie un récit de démonstration via l'API, comme le ferait le studio. */
export async function publishSample(
  author: TestClient,
  slug: string,
  overrides: { access?: 'free' | 'premium' | 'paid'; priceCents?: number | null } = {},
) {
  const sample = sampleStories.find((story) => story.slug === slug);
  if (!sample) throw new Error(`récit inconnu : ${slug}`);
  const created = await author.post('/api/v1/studio/stories', {
    title: sample.document.title,
    language: sample.document.language ?? 'fr',
    genres: sample.meta.genres,
    template: 'blank',
  });
  const id = created.body.id as string;
  const draft = await author.get(`/api/v1/studio/stories/${id}`);
  await author.put(`/api/v1/studio/stories/${id}/draft`, {
    revision: draft.body.revision,
    document: sample.document,
  });
  await author.patch(`/api/v1/studio/stories/${id}/meta`, {
    meta: {
      title: sample.document.title,
      tagline: sample.meta.tagline,
      synopsis: sample.meta.synopsis,
      language: sample.document.language ?? 'fr',
      genres: sample.meta.genres,
      tags: sample.meta.tags,
      ageRating: sample.meta.ageRating,
      contentWarnings: sample.meta.contentWarnings,
      access: overrides.access ?? sample.meta.access,
      priceCents:
        overrides.priceCents !== undefined ? overrides.priceCents : sample.meta.priceCents,
      license: sample.meta.license,
      aiUsage: 'none',
      coverUrl: null,
    },
  });
  const published = await author.post(`/api/v1/studio/stories/${id}/publish`, {
    visibility: 'public',
  });
  if (published.status !== 200)
    throw new Error(`publication impossible : ${JSON.stringify(published.body)}`);
  const detail = await author.get(`/api/v1/stories/${draft.body.slug}`);
  return { id, slug: draft.body.slug as string, versionId: detail.body.version.id as string };
}
