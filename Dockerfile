FROM node:20-alpine AS base

WORKDIR /app

# Copy workspace files
COPY package.json package-lock.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build all packages
RUN npm run build

# Development stage (all apps)
FROM base AS development
EXPOSE 3000 3002
CMD ["npm", "run", "dev"]
