# 0006 — PostgreSQL pour les données et la recherche

**Contexte.** Il faut stocker des comptes, des récits versionnés (documents JSON), des
statistiques agrégées et offrir une recherche plein texte tolérante aux accents.

**Décision.** PostgreSQL seul : `jsonb` pour les documents, colonnes générées `tsvector` avec
`unaccent` et `pg_trgm` pour la recherche, compteurs agrégés pour les statistiques, Drizzle ORM
pour un SQL typé et des migrations versionnées.

**Options écartées.** Elasticsearch/Meilisearch dès le départ (une infrastructure et une
synchronisation de plus pour un catalogue de quelques milliers de titres), base orientée
documents (relations fortes entre comptes, récits, éditions, avis et achats).

**Conséquences.** Une seule base à opérer et sauvegarder. Seuil de révision : au-delà d'environ
100 000 récits ou de besoins de recherche sémantique, ajouter un moteur dédié alimenté par des
événements.
