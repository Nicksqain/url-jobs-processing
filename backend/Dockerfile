FROM node:23-alpine AS development
WORKDIR /usr/src/app

RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-maxtimeout 600000 && \
    pnpm install --ignore-scripts

COPY . .
RUN pnpm run build

FROM node:23-alpine AS production
WORKDIR /usr/src/app
RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm config set fetch-retries 5 && \
    pnpm config set fetch-retry-maxtimeout 600000 && \
    pnpm install --prod --ignore-scripts

COPY --from=development /usr/src/app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]