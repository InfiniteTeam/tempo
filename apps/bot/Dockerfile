FROM node:18 AS Builder

WORKDIR /app

COPY package.json ./
COPY turbo.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./
COPY .yarn/ ./.yarn/

COPY apps/server/package.json ./apps/server/package.json

COPY packages/ ./packages/

RUN yarn install

COPY apps/server ./apps/server/

RUN yarn build --filter=bot

FROM node:18-alpine AS Server

WORKDIR /app

COPY --from=Builder /app/apps/server/dist/ ./dist
COPY --from=Builder /app/apps/server/package.json .

CMD ["node", "./dist/index.js"]
