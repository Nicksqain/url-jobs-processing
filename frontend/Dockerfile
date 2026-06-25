FROM node:23-slim AS development
WORKDIR /app

RUN npm i -g pnpm
COPY package.json pnpm-lock.yaml* ./

RUN pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-maxtimeout 1600000 && \
    pnpm install --ignore-scripts

COPY . .
RUN pnpm run build

FROM node:23-slim AS production
WORKDIR /app
RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-maxtimeout 160000 && \
    pnpm config set network-concurrency 1 && \
    pnpm install --ignore-scripts --no-verify-store-integrity

COPY --from=development /app/.next ./.next
COPY --from=development /app/public ./public
COPY --from=development /app/package.json ./package.json

EXPOSE 3000

CMD ["pnpm", "start"]