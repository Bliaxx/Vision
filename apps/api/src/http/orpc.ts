import { contract } from '@dedale/contracts';
import { implement, ORPCError } from '@orpc/server';
import { DomainError } from '../shared/errors';
import type { RequestContext, Viewer } from './context';

const STATUS: Record<DomainError['kind'], { code: string; status: number }> = {
  unauthorized: { code: 'UNAUTHORIZED', status: 401 },
  forbidden: { code: 'FORBIDDEN', status: 403 },
  not_found: { code: 'NOT_FOUND', status: 404 },
  conflict: { code: 'CONFLICT', status: 409 },
  unprocessable: { code: 'UNPROCESSABLE_CONTENT', status: 422 },
  payment_required: { code: 'PAYMENT_REQUIRED', status: 402 },
  rate_limited: { code: 'TOO_MANY_REQUESTS', status: 429 },
  unavailable: { code: 'SERVICE_UNAVAILABLE', status: 503 },
};

/** Traduit une erreur du domaine en erreur oRPC (code, statut, données typées). */
export function toORPCError(error: unknown): unknown {
  if (!(error instanceof DomainError)) return error;
  const { code, status } = STATUS[error.kind];
  return new ORPCError(code, {
    status,
    message: error.message,
    ...(error.data !== undefined ? { data: error.data } : {}),
    cause: error,
  });
}

const implementer = implement(contract).$context<RequestContext>();

/** Implémentation du contrat : toute procédure hérite de la traduction d'erreurs. */
export const os = implementer.use(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    throw toORPCError(error);
  }
});

/** Exige une session ; expose `context.user` aux gestionnaires. */
export const requireUser = implementer.middleware(async ({ context, next }) => {
  const user = await context.viewer();
  if (!user)
    throw new ORPCError('UNAUTHORIZED', { status: 401, message: 'Authentification requise' });
  return next({ context: { user } });
});

/** Exige un rôle de modération. */
export const requireModerator = implementer.middleware(async ({ context, next }) => {
  const user = await context.viewer();
  if (!user)
    throw new ORPCError('UNAUTHORIZED', { status: 401, message: 'Authentification requise' });
  if (user.role !== 'moderator' && user.role !== 'admin') {
    throw new ORPCError('FORBIDDEN', { status: 403, message: 'Réservé à la modération' });
  }
  return next({ context: { user } });
});

export type AuthedContext = RequestContext & { user: Viewer };
