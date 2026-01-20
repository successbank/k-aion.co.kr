# Multi-stage Dockerfile for NestJS Backend

# Stage 1: Development
FROM node:20-alpine AS development
WORKDIR /app

# Install pnpm and OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat && \
    npm install -g pnpm

# Copy package files and workspace config
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
COPY packages/types/package.json packages/types/

# Install all workspace dependencies
RUN pnpm install --recursive

# Copy source code
COPY . .

# Generate Prisma Client
RUN cd apps/backend && pnpm prisma:generate

EXPOSE 5659
CMD ["pnpm", "--filter", "@kaion/backend", "dev"]

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat && \
    npm install -g pnpm

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared/package.json packages/shared/
COPY packages/types/package.json packages/types/

RUN pnpm install --recursive

COPY . .

RUN cd apps/backend && pnpm prisma:generate
RUN pnpm --filter "@kaion/backend" build

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat && \
    npm install -g pnpm

COPY --from=builder /app/package.json /app/pnpm-lock.yaml* /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/backend/package.json /app/apps/backend/
COPY --from=builder /app/apps/backend/dist /app/apps/backend/dist
COPY --from=builder /app/apps/backend/prisma /app/apps/backend/prisma
COPY --from=builder /app/packages /app/packages

RUN pnpm install --prod --recursive
RUN cd apps/backend && pnpm prisma:generate

EXPOSE 5659
CMD ["node", "apps/backend/dist/main"]
