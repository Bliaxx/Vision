/**
 * Erreurs du domaine, indépendantes du transport. La couche HTTP les traduit
 * en erreurs oRPC typées (voir `http/orpc.ts`) : les services n'importent
 * jamais rien de l'API web.
 */
export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;
  readonly data: unknown;

  constructor(message: string, data?: unknown) {
    super(message);
    this.name = new.target.name;
    this.data = data;
  }
}

export type DomainErrorKind =
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'unprocessable'
  | 'payment_required'
  | 'rate_limited'
  | 'unavailable';

export class UnauthorizedError extends DomainError {
  readonly kind = 'unauthorized';
}
export class ForbiddenError extends DomainError {
  readonly kind = 'forbidden';
}
export class NotFoundError extends DomainError {
  readonly kind = 'not_found';
}
export class ConflictError extends DomainError {
  readonly kind = 'conflict';
}
export class UnprocessableError extends DomainError {
  readonly kind = 'unprocessable';
}
export class PaymentRequiredError extends DomainError {
  readonly kind = 'payment_required';
}
export class RateLimitedError extends DomainError {
  readonly kind = 'rate_limited';
}
export class UnavailableError extends DomainError {
  readonly kind = 'unavailable';
}
