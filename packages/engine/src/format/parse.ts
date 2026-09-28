import { StorySchema } from './schema';
import type { Story } from './types';

export interface FormatIssue {
  path: string;
  message: string;
}

export type ParseStoryResult =
  | { success: true; story: Story }
  | { success: false; issues: FormatIssue[] };

/**
 * Valide et normalise un document de récit non fiable (JSON importé, réponse
 * réseau, stockage local). Ne lève jamais d'exception.
 */
export function parseStory(input: unknown): ParseStoryResult {
  const result = StorySchema.safeParse(input);
  if (result.success) return { success: true, story: result.data };
  return {
    success: false,
    issues: result.error.issues.map((issue) => ({
      path: issue.path.map(String).join('.'),
      message: issue.message,
    })),
  };
}
