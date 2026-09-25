FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY vite.config.ts ./
COPY frontend ./frontend
RUN npm run build:frontend

FROM nginxinc/nginx-unprivileged:alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend /usr/share/nginx/html
EXPOSE 8080