FROM node:lts

# Clone and move into directory
RUN git clone https://github.com/IntellectualSites/Arkitektonika.git /app
WORKDIR /app

# Install dependencies
RUN yarn install

# Start the app
CMD ["yarn", "start"]
