FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json manifest.yaml README.md AGENTS.md ./
COPY src ./src
COPY scripts ./scripts

RUN npm run build \
    && npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 7860

CMD ["npm", "run", "start"]
