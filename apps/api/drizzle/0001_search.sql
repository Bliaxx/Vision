-- Recherche plein texte insensible aux accents et à la casse.
CREATE EXTENSION IF NOT EXISTS unaccent;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
-- unaccent() et array_to_string() ne sont pas IMMUTABLE : on les enveloppe pour
-- pouvoir les utiliser dans une colonne générée et un index.
CREATE OR REPLACE FUNCTION dedale_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
  AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION dedale_words(text[]) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE
  AS $$ SELECT coalesce(array_to_string($1, ' '), '') $$;
--> statement-breakpoint
ALTER TABLE "stories" ADD COLUMN "search" tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('simple'::regconfig, dedale_unaccent(coalesce("title", ''))), 'A') ||
  setweight(to_tsvector('simple'::regconfig, dedale_unaccent(coalesce("tagline", ''))), 'B') ||
  setweight(to_tsvector('simple'::regconfig, dedale_unaccent(dedale_words("tags"))), 'B') ||
  setweight(to_tsvector('simple'::regconfig, dedale_unaccent(coalesce("synopsis", ''))), 'C')
) STORED;
--> statement-breakpoint
CREATE INDEX "stories_search_idx" ON "stories" USING gin ("search");
--> statement-breakpoint
CREATE INDEX "stories_title_trgm_idx" ON "stories" USING gin (dedale_unaccent("title") gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX "stories_genres_idx" ON "stories" USING gin ("genres");
