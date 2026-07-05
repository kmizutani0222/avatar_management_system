FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/operator-web/package.json ./apps/operator-web/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/web-auth/package.json ./packages/web-auth/
RUN pnpm install --filter @ams/operator-web...

FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/operator-web/node_modules ./apps/operator-web/node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/packages/web-auth/node_modules ./packages/web-auth/node_modules
COPY . .
RUN pnpm --filter @ams/shared-types build && pnpm --filter @ams/web-auth build
WORKDIR /app/apps/operator-web
EXPOSE 3000
CMD ["sh", "-c", "pnpm install --filter @ams/operator-web... && pnpm --filter @ams/shared-types build && pnpm --filter @ams/web-auth build && pnpm dev"]

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/operator-web/node_modules ./apps/operator-web/node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/packages/web-auth/node_modules ./packages/web-auth/node_modules
COPY . .
RUN pnpm --filter @ams/shared-types build && pnpm --filter @ams/web-auth build
WORKDIR /app/apps/operator-web
RUN pnpm build

FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app .
WORKDIR /app/apps/operator-web
EXPOSE 3000
CMD ["pnpm", "start"]
