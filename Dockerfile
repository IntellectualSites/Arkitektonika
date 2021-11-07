# Build the application
# -> transpile typescript to javascript
FROM node:lts AS builder

WORKDIR /usr/src/app

COPY package.json ./
COPY tsconfig.json ./
COPY yarn.lock ./
COPY ./app ./app
RUN yarn install ; yarn build

# Application runner
# -> runs the transpiled code itself
# seperated from builder context to keep image as slim as possible
FROM node:lts

WORKDIR /app
ENV NODE_ENV=production

COPY package.json ./
COPY yarn.lock ./
RUN yarn install --only=production
COPY --from=builder /usr/src/app/dist/app ./app
EXPOSE 3000
CMD [ "node", "app/launch.js" ]