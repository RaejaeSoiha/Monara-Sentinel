FROM node:20-alpine AS base

WORKDIR /app

COPY package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install

RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

RUN npm run build --workspace=@monara-sentinel/worker

CMD ["node", "apps/worker/dist/index.js"]
