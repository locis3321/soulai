FROM node:20-alpine AS base
WORKDIR /app
ENV npm_config_nodedir=/usr/local
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories \
  && apk add --no-cache python3 py3-setuptools make g++
COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM base AS development
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

FROM base AS production
COPY . .
RUN npm run build
# Copy migration SQL files into dist (tsc does not copy non-TS files)
RUN mkdir -p dist/db/migrations && cp src/db/migrations/*.sql dist/db/migrations/
EXPOSE 4000
CMD ["node", "dist/index.js"]
