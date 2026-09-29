# Développement

## Prérequis

- Node.js **22** (`.nvmrc`) et pnpm **10** : `corepack enable` suffit (version fixée par `packageManager`).
- Docker (PostgreSQL local), ou un PostgreSQL 16+ avec les extensions `unaccent` et `pg_trgm`.
- Mobile : Xcode (iOS) ou Android Studio pour les simulateurs ; un compte Expo pour EAS.

## Installation

```bash
pnpm install
cp .env.example .env        # chaque variable y est documentée
pnpm db:up                  # PostgreSQL 18 + base de test (infra/docker-compose.yml)
pnpm db:migrate
pnpm db:seed                # données de démonstration (réinitialise la base)
pnpm dev                    # API :4000 + site :3000 (rechargement à chaud)
```

Comptes de démonstration, mot de passe `dedale-demo-2026` :

| Compte | Rôle |
| --- | --- |
| `camille@demo.dedale.app` | Lectrice, offre Explorateur, parties en cours |
| `jules@demo.dedale.app` · `sarah@…` · `nora@…` | Lecteurs (offres Promeneur, Famille) |
| `aurore@demo.dedale.app` · `malik@…` · `ines@…` · `theo@…` | Auteurs des récits d'exemple |
| `admin@demo.dedale.app` | Administration et modération |

Sans clé Stripe ni clé Anthropic, les adaptateurs simulés sont utilisés : paiements réglés
instantanément, Muse hors ligne. L'API indique les adaptateurs actifs sur `GET /ready`.

## Scripts

| Commande | Effet |
| --- | --- |
| `pnpm dev` | API et site en mode développement |
| `pnpm dev:mobile` | Serveur Metro de l'app mobile |
| `pnpm build` | Build de production de tous les paquets (Turborepo, avec cache) |
| `pnpm typecheck` | Vérification des types partout |
| `pnpm test` | Tests unitaires et d'intégration (l'API utilise `TEST_DATABASE_URL`) |
| `pnpm test:e2e` | Parcours Playwright : réutilise l'API et le site s'ils tournent, sinon démarre les builds de production (`pnpm build` au préalable) |
| `pnpm lint` / `pnpm lint:fix` | Biome : lint et formatage |
| `pnpm db:generate` | Génère une migration Drizzle après modification du schéma |
| `pnpm db:migrate` / `pnpm db:seed` | Applique les migrations / recharge les données de démonstration |
| `pnpm tokens:build` | Régénère `tokens.css` depuis les jetons de marque |
| `pnpm --filter @dedale/api openapi` | Régénère `docs/api/openapi.json` depuis le contrat |

## Organisation du code

- Une fonctionnalité d'API = un module `apps/api/src/modules/<nom>` (service, requêtes, routeur)
  + ses routes dans `packages/contracts/src/contract.ts`. Le contrat change d'abord ; le
  compilateur signale ensuite tout ce qui doit suivre (serveur, web, mobile).
- Les textes visibles vivent dans `packages/i18n/messages/{fr,en}.json`. Un test vérifie que les
  deux langues ont les mêmes clés, les mêmes arguments ICU et des messages valides.
- Les couleurs, polices, rayons et durées viennent de `packages/tokens` : jamais de valeur en dur
  dans les applications.
- Le moteur ne dépend ni du DOM ni de Node : il doit tourner dans le navigateur, sous Hermes et
  sur le serveur.

## Web

- Next.js 16 : lire `apps/web/AGENTS.md`. Les conventions ont changé par rapport aux versions
  précédentes (`proxy.ts` au lieu de `middleware.ts`, paramètres de page asynchrones,
  `retry` dans les pages d'erreur, types de routes générés par `next typegen`).
- En développement, le navigateur appelle `/api/*` sur le site, réécrit vers l'API : cookies de
  même origine, pas de CORS.

## Mobile

```bash
pnpm dev:mobile             # puis « i » (iOS) ou « a » (Android)
```

- L'API est trouvée automatiquement sur la machine qui sert Metro en développement ; sinon,
  définir `EXPO_PUBLIC_API_URL`.
- Les modules natifs utilisés (SQLite, SecureStore, synthèse vocale, haptique) sont inclus dans
  Expo Go ; un build de développement (`eas build --profile development`) est recommandé pour
  les onglets natifs et les icônes finales.
- Vérifier que Metro résout tout le monorepo et produit le bytecode Hermes :
  `pnpm --filter @dedale/mobile bundle:check`.
- Builds : `eas build --profile preview|production` (voir `apps/mobile/eas.json`).

## Tests

| Paquet | Outil | Notes |
| --- | --- | --- |
| `packages/*` | Vitest | Rapides, sans réseau |
| `apps/api` | Vitest + PostgreSQL | Base `dedale_test` vidée et migrée au démarrage |
| `apps/web` | Vitest, Playwright | `E2E_BASE_URL` pour cibler un serveur déjà lancé ; `PLAYWRIGHT_CHROMIUM_PATH` pour un Chromium préinstallé |
| `apps/mobile` | Jest (jest-expo) + Testing Library | Stockage SQLite simulé en mémoire |

## Conteneurs

```bash
docker compose -f infra/docker-compose.yml --profile app up --build
docker compose -f infra/docker-compose.yml --profile app run --rm api node dist/seed.mjs --reset
```

Ports publiés configurables (`POSTGRES_PORT`, `API_PORT`, `WEB_PORT`). Derrière un proxy
d'entreprise, passer `HTTPS_PROXY` en argument de build et une image de base qui fait confiance
à l'autorité de certification via `--build-arg NODE_IMAGE=…` ; Turborepo transmet
`HTTP(S)_PROXY`, `NO_PROXY` et `NODE_EXTRA_CA_CERTS` aux tâches.

## Variables d'environnement

Toutes sont décrites dans [`.env.example`](../.env.example). En production, l'API refuse de
démarrer si `AUTH_SECRET` fait moins de 32 caractères, ou sans clé Stripe (sauf
`DEMO_MODE=true`, réservé aux instances de démonstration).
