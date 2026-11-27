FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY backend ./backend
COPY contracts ./contracts
COPY tsconfig*.json ./
RUN npm run build

FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY backend/assets ./backend/assets

RUN mkdir -p /app/uploads/icons && chown -R node:node /app/uploads
USER node

CMD ["sh", "-c", "node dist/backend/src/database/migration-runner/migrationCli.js && node dist/backend/src/database/seeding/seedDefaultFeatures.js && exec node dist/backend/src/server.js"]
