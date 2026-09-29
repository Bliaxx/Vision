# syntax=docker/dockerfile:1.7
#
# API Dédale — bundle autonome (code interne + dépendances npm, voir
# apps/api/tsdown.config.ts) : l'image d'exécution ne contient que Node.js,
# le JavaScript compilé et les migrations SQL. Aucun node_modules.
#
#   docker build -f infra/docker/api.Dockerfile -t dedale/api .
#
ARG NODE_IMAGE=node:22-alpine

FROM ${NODE_IMAGE} AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=true
RUN corepack enable
WORKDIR /repo

# 1. Sous-dépôt minimal : uniquement l'API et les paquets dont elle dépend.
FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.11.5 prune @dedale/api --docker

# 2. Dépendances (couche mise en cache tant que le lockfile ne change pas), puis build.
FROM base AS builder
COPY --from=pruner /repo/out/json/ .
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile
COPY --from=pruner /repo/out/full/ .
RUN pnpm --filter @dedale/api build

# 3. Exécution : utilisateur non privilégié, vérification de santé intégrée.
FROM ${NODE_IMAGE} AS runtime
ENV NODE_ENV=production PORT=4000
WORKDIR /app
COPY --from=builder --chown=node:node /repo/apps/api/dist ./dist
COPY --from=builder --chown=node:node /repo/apps/api/drizzle ./drizzle
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health >/dev/null || exit 1
# Migrations : `node dist/migrate.mjs` · données de démonstration : `node dist/seed.mjs --reset`
CMD ["node", "--enable-source-maps", "dist/main.mjs"]
