FROM node:20-alpine AS base

WORKDIR /app

# Copy workspace files
COPY package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

# Build all packages (turbo will build dependencies first)
RUN npm run build --workspace=@monara-sentinel/api

EXPOSE 3002

CMD ["node", "apps/api/dist/index.js"]
