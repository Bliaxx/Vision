import { z } from 'zod';
import { HandleSchema, IsoDateSchema, LocaleSchema, UserRoleSchema } from '../domain';
import { EntitlementSchema, PlanSchema } from '../plans';

export const ProfileSchema = z.object({
  handle: HandleSchema,
  displayName: z.string().min(1).max(60),
  bio: z.string().max(600).nullable(),
  avatarUrl: z.string().nullable(),
  links: z.array(z.object({ label: z.string().max(40), url: z.url() })).max(5),
  locale: LocaleSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;

export const SubscriptionSchema = z.object({
  plan: PlanSchema,
  status: z.enum(['active', 'trialing', 'past_due', 'canceled']),
  interval: z.enum(['month', 'year']).nullable(),
  renewsAt: IsoDateSchema.nullable(),
});

export const MeSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.email(),
    name: z.string(),
    role: UserRoleSchema,
  }),
  profile: ProfileSchema,
  subscription: SubscriptionSchema,
  entitlements: z.array(EntitlementSchema),
});
export type Me = z.infer<typeof MeSchema>;

export const UpdateProfileInputSchema = ProfileSchema.omit({ avatarUrl: true }).partial();
