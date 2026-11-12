# ==========================================
# Build Stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace configurations
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/api ./apps/api

# Generate Prisma Client & Build TypeScript
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# ==========================================
# Production Stage
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built artifacts and dependencies
COPY package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist

USER appuser

EXPOSE 5000

WORKDIR /app/apps/api
CMD ["node", "dist/server.js"]

