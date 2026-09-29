import { z } from 'zod';
import { UuidSchema } from '../domain';

export const MuseInputSchema = z.object({
  storyId: UuidSchema,
  passageId: z.string().min(1).max(64),
});

export const ChoiceSuggestionsSchema = z.object({
  suggestions: z.array(z.object({ text: z.string(), direction: z.string() })).max(5),
});
export type ChoiceSuggestions = z.infer<typeof ChoiceSuggestionsSchema>;

export const CritiqueSchema = z.object({
  notes: z.array(
    z.object({
      kind: z.enum(['continuity', 'style', 'pacing', 'typo', 'choice']),
      excerpt: z.string().nullable(),
      comment: z.string(),
    }),
  ),
});
export type Critique = z.infer<typeof CritiqueSchema>;
