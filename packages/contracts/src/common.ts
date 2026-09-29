import { z } from 'zod';

export const CursorSchema = z.string().max(200).optional();

export const PaginationInputSchema = z.object({
  cursor: CursorSchema,
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export function pageOf<T extends z.ZodType>(item: T) {
  return z.object({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}

export type Page<T> = { items: T[]; nextCursor: string | null };

export const OkSchema = z.object({ ok: z.literal(true) });
