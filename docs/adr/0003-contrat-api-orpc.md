# 0003 — Contrat d'API unique avec oRPC

**Contexte.** Deux clients (web, mobile) et des partenaires (écoles, éditeurs, outils tiers)
consomment l'API. Les divergences entre serveur, clients et documentation sont la première
source de bugs d'intégration.

**Décision.** Toutes les routes sont déclarées dans `@dedale/contracts` avec oRPC : schémas zod
d'entrée et de sortie, méthode et chemin HTTP, **erreurs métier typées** (`NOT_FOUND`,
`CONFLICT` avec la révision courante, `PAYMENT_REQUIRED`…). Le serveur implémente le contrat
(`implement(contract)`), les clients en dérivent un client typé et des fabriques TanStack
Query ; la même définition expose un RPC compact (`/api/rpc`) pour nos applications et une API
REST documentée en OpenAPI 3.1 (`/api/v1`) pour les partenaires.

**Options écartées.** tRPC (pas de REST/OpenAPI natif pour les partenaires), GraphQL (surcoût
pour un domaine aux requêtes prévisibles), REST écrit à la main + génération de client
(deux sources de vérité).

**Conséquences.** Renommer un champ casse la compilation de tous les consommateurs, ce qui est
voulu. La spécification OpenAPI est générée (`pnpm --filter @dedale/api openapi`).
