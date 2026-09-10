FROM node:20-alpine AS base

WORKDIR /app

COPY package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install

RUN npx prisma generate --schema=packages/database/prisma/schema.prisma

RUN npm run build --workspace=@monara-sentinel/web

EXPOSE 3000

CMD ["npm", "start", "--workspace=@monara-sentinel/web"]
