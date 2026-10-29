# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
ENV NODE_ENV=production
# Build-time placeholders. Runtime values come from the container environment.
ENV DATABASE_URL=postgres://build:build@127.0.0.1:5432/build
ENV AUTH_SECRET=build-only-secret-not-used-at-runtime
ENV APP_URL=http://localhost:3000
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]

# Migration and seed image. The standalone runtime does not include drizzle-kit
# or the TypeScript source, so tooling is kept in a separate target.
FROM deps AS tools
ENV NODE_ENV=production
COPY drizzle.config.ts tsconfig.json ./
COPY drizzle ./drizzle
COPY src ./src
CMD ["npm", "run", "db:migrate"]
