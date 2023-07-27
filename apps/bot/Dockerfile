FROM node:18 AS Builder

WORKDIR /app

COPY package.json ./
COPY turbo.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./
COPY tsup.config.ts ./
COPY .yarn/ ./.yarn/

COPY apps/bot/package.json ./apps/bot/package.json

COPY packages/ ./packages/

RUN yarn install --inline-builds

COPY apps/bot ./apps/bot/

RUN yarn build --filter=bot

FROM node:18-alpine AS Server

WORKDIR /app

COPY --from=Builder /app/apps/bot/dist/ ./dist
COPY --from=Builder /app/apps/bot/package.json .

CMD ["node", "./dist/index.js"]
