FROM node:20-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN corepack enable && pnpm install --frozen-lockfile

COPY . .

ARG VITE_COPY_URL
ENV VITE_COPY_URL=$VITE_COPY_URL

RUN pnpm build

FROM nginx:1.27-alpine AS runtime

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
