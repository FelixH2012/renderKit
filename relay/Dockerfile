FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json esbuild.config.mjs postcss.config.js tailwind.config.js ./
COPY src ./src
COPY relay ./relay

RUN npm run build

ENV RENDERKIT_RELAY_PORT=8787
EXPOSE 8787

CMD ["node", "relay/server.js"]
