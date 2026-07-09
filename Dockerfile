FROM node:20-slim

WORKDIR /app

ENV PORT=7860 \
    SENTINEL_HEALTH_SERVER=true

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production

EXPOSE 7860

CMD ["npm", "run", "start"]
