import { StorySchema } from '@dedale/engine';
import { sampleStories } from '@dedale/samples';
import { describe, expect, it } from 'vitest';
import { coverArt } from '@/components/brand/cover-art';
import { layoutStory } from '@/lib/story-layout';

describe('couvertures génératives', () => {
  it('sont déterministes et propres à chaque récit', () => {
    expect(coverArt('le-phare', 'fantasy')).toEqual(coverArt('le-phare', 'fantasy'));
    expect(coverArt('le-phare', 'fantasy').walls).not.toEqual(
      coverArt('nuit-blanche', 'fantasy').walls,
    );
  });

  it('tracent un fil qui aboutit au centre du labyrinthe', () => {
    const art = coverArt('signal', 'science-fiction');
    expect(art.thread.endsWith(`L ${art.knot.x} ${art.knot.y}`)).toBe(true);
  });
});

describe('disposition du graphe', () => {
  it('positionne chaque passage, le départ au-dessus des fins', () => {
    const story = StorySchema.parse(sampleStories[0]?.document);
    const positions = layoutStory(story);
    expect(positions.size).toBe(story.passages.length);
    const start = positions.get(story.start);
    const endings = story.passages
      .filter((passage) => passage.ending)
      .map((passage) => positions.get(passage.id));
    for (const ending of endings) expect(ending?.y).toBeGreaterThan(start?.y ?? 0);
  });
});
