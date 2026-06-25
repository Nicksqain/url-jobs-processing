FROM node:23-slim AS development
WORKDIR /usr/src/app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-maxtimeout 160000 && \
    pnpm config set network-concurrency 1 && \
    pnpm install --ignore-scripts --no-verify-store-integrity

COPY . .
RUN pnpm run build

FROM node:23-slim AS production
WORKDIR /usr/src/app
RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-maxtimeout 160000 && \
    pnpm config set network-concurrency 1 && \
    pnpm install --ignore-scripts --no-verify-store-integrity

COPY --from=development /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]