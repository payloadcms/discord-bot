FROM node:20-alpine AS builder

RUN mkdir -p /app
WORKDIR /app

COPY package.json  .
COPY yarn.lock .

RUN yarn install

COPY . .

EXPOSE 3000
CMD [ "yarn", "run", "start" ]