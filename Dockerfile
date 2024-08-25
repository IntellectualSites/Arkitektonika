# Build the application
# -> transpile typescript to javascript
FROM node:lts AS builder

WORKDIR /usr/src/app

COPY package.json ./
COPY tsconfig.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./
COPY ./app ./app
RUN corepack enable ; yarn set version latest ; yarn install ; yarn build

# Application runner
# -> runs the transpiled code itself
# seperated from builder context to keep image as slim as possible
FROM node:lts-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY yarn.lock ./
COPY .yarnrc.yml ./
COPY --from=builder /usr/src/app/dist/app ./app
RUN corepack enable ; yarn set version latest; \
    RUN yarn workspaces focus --all --production && rm -rf "$(yarn cache clean)" ; yarn install
# "temporary" fix to allow directory traversal in both docker and non-docker environments
# Can't just change the app directory, as that might break existing directory mounts - so it'll do
RUN cp package.json ./../package.json
EXPOSE 3000
CMD [ "node", "app/launch.js" ]

LABEL \
  org.opencontainers.image.vendor="IntellectualSites" \
  org.opencontainers.image.title="Arkitektonika" \
  org.opencontainers.image.description="A REST repository for NBT data for Minecraft" \
  org.opencontainers.image.url="https://github.com/IntellectualSites" \
  org.opencontainers.image.source="https://github.com/IntellectualSites/Arkitektonika" \
  org.opencontainers.image.licenses="ISC" \
  com.docker.image.source.entrypoint=Dockerfile
