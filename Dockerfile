FROM oven/bun:latest AS base
WORKDIR /app
RUN apt-get update && apt-get install -y git wget net-tools iputils-ping && rm -rf /var/lib/apt/lists/*
ENV SENTRYCLI_SKIP_DOWNLOAD=1

FROM base AS deps
COPY package.json ./
COPY bun.lock* ./

COPY apps/api/package.json ./apps/api/
COPY apps/storefront/package.json ./apps/storefront/

COPY packages/storefront-engine/package.json ./packages/storefront-engine/
COPY packages/ui-kit/package.json ./packages/ui-kit/

COPY packages/audit/package.json ./packages/audit/
COPY packages/cache/package.json ./packages/cache/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/encryption/package.json ./packages/encryption/
COPY packages/monitoring/package.json ./packages/monitoring/
COPY packages/provisioning/package.json ./packages/provisioning/
COPY packages/redis/package.json ./packages/redis/
COPY packages/security/package.json ./packages/security/
COPY packages/storage/package.json ./packages/storage/
COPY packages/validators/package.json ./packages/validators/

RUN --mount=type=cache,id=bun,target=/root/.bun/install/cache     bun install

FROM deps AS builder
COPY . .
RUN bun x turbo run build

# API Runner
FROM base AS api-runner
COPY --from=builder /app /app
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["bun", "run", "start"]

# Storefront Runner
FROM base AS storefront-runner
COPY --from=builder /app /app
WORKDIR /app/apps/storefront
EXPOSE 3002
CMD ["bun", "run", "start"]
