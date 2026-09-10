FROM node:20-alpine AS base

WORKDIR /app

COPY package.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install

RUN npm run build --workspace=@monara-sentinel/public-check

CMD ["node", "apps/public-check/dist/index.js"]
