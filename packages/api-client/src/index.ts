import { type Contract, contract } from '@dedale/contracts';
import { createORPCClient, isDefinedError, ORPCError, safe } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { type ContractRouterClient, inferRPCMethodFromContractRouter } from '@orpc/contract';
import { createTanstackQueryUtils } from '@orpc/tanstack-query';

/** Client typé de bout en bout : chaque appel est vérifié contre le contrat. */
export type ApiClient = ContractRouterClient<Contract>;

export interface ApiClientOptions {
  /** Origine de l'API, ex. `https://api.dedale.app` (ou l'origine du site derrière un proxy). */
  readonly baseUrl: string;
  /** En-têtes ajoutés à chaque requête (cookie de session côté serveur, jeton mobile…). */
  readonly headers?: () => Record<string, string> | Promise<Record<string, string>>;
  /** Politique d'envoi des cookies (`include` par défaut). */
  readonly credentials?: RequestCredentials;
  readonly fetch?: typeof fetch;
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const doFetch = options.fetch ?? fetch;
  const link = new RPCLink({
    url: `${options.baseUrl.replace(/\/$/, '')}/api/rpc`,
    // Les lectures partent en GET (mises en cache HTTP), les écritures en POST.
    method: inferRPCMethodFromContractRouter(contract),
    headers: async () => (await options.headers?.()) ?? {},
    fetch: (request, init) =>
      doFetch(request, { ...init, credentials: options.credentials ?? 'include' }),
  });
  return createORPCClient(link);
}

/** Fabriques de requêtes TanStack Query (clés, options, mutations) dérivées du contrat. */
export function createQueryUtils(client: ApiClient) {
  return createTanstackQueryUtils(client);
}

export type QueryUtils = ReturnType<typeof createQueryUtils>;

/** Code d'erreur métier (`NOT_FOUND`, `PAYMENT_REQUIRED`…) ou `null`. */
export function apiErrorCode(error: unknown): string | null {
  return error instanceof ORPCError ? error.code : null;
}

export { isDefinedError, ORPCError, safe };
