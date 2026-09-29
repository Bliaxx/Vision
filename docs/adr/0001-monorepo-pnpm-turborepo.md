# 0001 — Monorepo pnpm + Turborepo

**Contexte.** Trois applications (API, web, mobile) partagent un moteur de jeu, un contrat
d'API, une identité visuelle et des traductions. Les faire vivre dans des dépôts séparés
imposerait de publier et versionner chaque paquet, et de synchroniser les montées de version.

**Décision.** Un monorepo géré par pnpm (espaces de travail, catalogue de versions communes,
React imposé en version unique) et orchestré par Turborepo (graphe de tâches, cache,
`turbo prune` pour les images Docker). Les paquets internes exposent directement leur source
TypeScript ; chaque outil de build (Next.js, Metro, tsdown) la compile.

**Options écartées.** Nx (plus lourd pour un besoin simple), dépôts séparés (coût de
synchronisation), paquets internes précompilés (étape de build et artefacts en plus, pour un
gain nul).

**Conséquences.** Une modification du moteur est testée immédiatement par le web, le mobile et
l'API dans la même intégration continue. Les paquets internes doivent rester compatibles avec
les trois environnements (pas d'API Node ou DOM dans `engine`, `contracts`, `tokens`, `i18n`).
