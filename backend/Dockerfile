# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install openssl for Prisma binary compatibility on Alpine
RUN apk add --no-cache openssl

# Copy dependency specifications
COPY package.json package-lock.json ./

# Install all dependencies
RUN npm ci

# Copy Prisma schema and generate Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Copy tsconfig and source code
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript
RUN npm run build

# Prune devDependencies to keep node_modules minimal for runtime
RUN npm prune --production

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install openssl for Prisma binary compatibility on Alpine
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV PORT=4000

# Copy pruned dependencies, built app, and Prisma artifacts with non-root ownership
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/prisma ./prisma

USER node

EXPOSE 4000


CMD ["sh", "-c", "npx prisma migrate deploy && node dist/scripts/seed.js && node dist/server.js"]
