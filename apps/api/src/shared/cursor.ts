/**
 * Curseurs de pagination opaques : les clients ne dépendent pas de leur
 * contenu, ce qui permettra de passer d'un décalage à une pagination par clé
 * sans changer le contrat.
 */
export function encodeCursor(offset: number): string {
  return Buffer.from(JSON.stringify({ o: offset })).toString('base64url');
}

export function decodeCursor(cursor: string | undefined): number {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as { o?: unknown };
    return typeof parsed.o === 'number' && parsed.o >= 0 ? Math.floor(parsed.o) : 0;
  } catch {
    return 0;
  }
}

export function paginate<T>(rows: T[], offset: number, limit: number) {
  const hasMore = rows.length > limit;
  return {
    items: hasMore ? rows.slice(0, limit) : rows,
    nextCursor: hasMore ? encodeCursor(offset + limit) : null,
  };
}
