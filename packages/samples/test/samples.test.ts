import { analyzeStory, compileStory, StorySchema, simulate } from '@dedale/engine';
import { describe, expect, it } from 'vitest';
import { landingDemo, sampleAuthors, sampleStories } from '../src';

const documents = [
  ...sampleStories.map((story) => [story.slug, story.document] as const),
  ['demo-fr', landingDemo.fr] as const,
  ['demo-en', landingDemo.en] as const,
];

describe.each(documents)('récit %s', (_slug, input) => {
  const story = StorySchema.parse(input);

  it('est valide et sans avertissement', () => {
    const report = analyzeStory(story);
    const blocking = report.diagnostics.filter((d) => d.severity !== 'info');
    expect(blocking).toEqual([]);
  });

  it('se termine toujours et couvre tout le récit en simulation', () => {
    const result = simulate(compileStory(story), { runs: 400, seed: 11 });
    expect(result.stuck + result.exhausted + result.errors).toBe(0);
    expect(result.completed).toBe(400);
    expect(result.coverage).toBeGreaterThan(0.9);
  });
});

describe('catalogue de démonstration', () => {
  it('attribue chaque récit à un auteur connu, avec des slugs uniques', () => {
    const keys = new Set(sampleAuthors.map((author) => author.key));
    for (const story of sampleStories) expect(keys.has(story.author)).toBe(true);
    expect(new Set(sampleStories.map((story) => story.slug)).size).toBe(sampleStories.length);
  });
});
