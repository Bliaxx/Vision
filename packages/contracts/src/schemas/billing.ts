import { z } from 'zod';
import { UuidSchema } from '../domain';
import { BillingIntervalSchema, EntitlementSchema, PlanSchema } from '../plans';

export const PlanOfferSchema = z.object({
  id: PlanSchema,
  monthly: z.number().int().nullable(),
  yearly: z.number().int().nullable(),
  entitlements: z.array(EntitlementSchema),
  audience: z.enum(['reader', 'author', 'organization']),
  highlighted: z.boolean(),
});

export const CheckoutInputSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('subscription'),
    plan: z.enum(['explorer', 'family', 'architect']),
    interval: BillingIntervalSchema,
  }),
  z.object({ kind: z.literal('story'), storyId: UuidSchema }),
  z.object({
    kind: z.literal('tip'),
    storyId: UuidSchema,
    amountCents: z.number().int().min(100).max(10_000),
  }),
]);
export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;

export const RedirectSchema = z.object({ url: z.url() });
