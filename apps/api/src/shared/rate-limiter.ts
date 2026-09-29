/**
 * Limiteur à fenêtre glissante. L'implémentation mémoire suffit pour une
 * instance ; en production multi-instances on branche un adaptateur Redis
 * derrière la même interface.
 */
export interface RateLimiter {
  /** Consomme un jeton ; retourne `false` si la limite est atteinte. */
  consume(key: string, limit: number, windowMs: number): boolean;
}

export class MemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, number[]>();

  consume(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
    const since = now - windowMs;
    const recent = (this.hits.get(key) ?? []).filter((time) => time > since);
    if (recent.length >= limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 50_000) this.sweep(since);
    return true;
  }

  private sweep(since: number): void {
    for (const [key, times] of this.hits) {
      if (!times.some((time) => time > since)) this.hits.delete(key);
    }
  }
}
