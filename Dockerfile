# Build the application
# -> transpile typescript to javascript
FROM node:lts@sha256:e9ad817b0d42b4d177a4bef8a0aff97c352468a008c3fdb2b4a82533425480df AS builder

WORKDIR /usr/src/app

COPY package.json ./
COPY tsconfig.json ./
COPY yarn.lock ./
COPY ./app ./app
RUN yarn install ; yarn build

# Application runner
# -> runs the transpiled code itself
# seperated from builder context to keep image as slim as possible
FROM node:lts@sha256:e9ad817b0d42b4d177a4bef8a0aff97c352468a008c3fdb2b4a82533425480df

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY yarn.lock ./
RUN yarn install --only=production
COPY --from=builder /usr/src/app/dist/app ./app
EXPOSE 3000
CMD [ "node", "app/launch.js" ]

LABEL \
  org.opencontainers.image.vendor="IntellectualSites" \
  org.opencontainers.image.title="Arkitektonika" \
  org.opencontainers.image.description="A REST repository for NBT data for Minecraft" \
  org.opencontainers.image.url="https://github.com/IntellectualSites" \
  org.opencontainers.image.source="https://github.com/IntellectualSites/Arkitektonika" \
  org.opencontainers.image.licenses="ISC"
