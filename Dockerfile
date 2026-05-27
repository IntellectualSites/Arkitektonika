FROM node:22-bookworm AS builder

WORKDIR /usr/src/app

RUN corepack enable

# required for native builds
RUN apt-get update && apt-get install -y \
  python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json yarn.lock .yarnrc.yml ./

RUN yarn install --immutable

# 🔥 CRITICAL FIX: force native rebuild
RUN yarn add better-sqlite3 --build-from-source

COPY app ./app
COPY tsconfig.json ./

RUN yarn build


FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist/app ./app

CMD ["node", "app/launch.js"]
