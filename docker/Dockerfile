FROM node:16-alpine

ARG ENV_PATH=.env

WORKDIR /app

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN pnpm i --frozen-lockfile

COPY src ./src
COPY ${ENV_PATH} ./.env

EXPOSE 8000

CMD pnpm start
