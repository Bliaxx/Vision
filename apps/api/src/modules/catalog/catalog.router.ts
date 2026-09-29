import { os } from '../../http/orpc';
import type { CatalogQueries } from './catalog.queries';

export function catalogRouter(queries: CatalogQueries) {
  return {
    home: os.catalog.home.handler(() => queries.home()),
    list: os.catalog.list.handler(({ input }) => queries.list(input)),
    story: os.catalog.story.handler(async ({ input, context }) =>
      queries.story(input.slug, await context.viewer()),
    ),
    author: os.catalog.author.handler(async ({ input, context }) =>
      queries.author(input.handle, await context.viewer()),
    ),
  };
}
