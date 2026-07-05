FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/web-auth/package.json ./packages/web-auth/
COPY packages/parts-baker/package.json ./packages/parts-baker/
RUN pnpm install --filter @ams/api...

FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/packages/parts-baker/node_modules ./packages/parts-baker/node_modules
COPY . .
RUN pnpm --filter @ams/shared-types build && pnpm --filter @ams/parts-baker build
WORKDIR /app/apps/api
RUN pnpm db:generate
EXPOSE 3000
CMD ["sh", "-c", "pnpm install --filter @ams/api... && pnpm --filter @ams/shared-types build && pnpm --filter @ams/parts-baker build && pnpm db:push && pnpm db:seed && exec pnpm dev"]

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared-types/node_modules ./packages/shared-types/node_modules
COPY --from=deps /app/packages/parts-baker/node_modules ./packages/parts-baker/node_modules
COPY . .
RUN pnpm --filter @ams/shared-types build && pnpm --filter @ams/parts-baker build
WORKDIR /app/apps/api
RUN pnpm db:generate && pnpm build

FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=build /app/packages/shared-types/package.json ./packages/shared-types/package.json
COPY --from=build /app/packages/parts-baker/dist ./packages/parts-baker/dist
COPY --from=build /app/packages/parts-baker/package.json ./packages/parts-baker/package.json
COPY package.json pnpm-workspace.yaml ./
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["sh", "-c", "pnpm exec prisma db push && node dist/main.js"]
