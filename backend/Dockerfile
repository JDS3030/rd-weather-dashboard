# Backend — Node.js 20 (Express)
FROM node:20-alpine

# curl: usado por el healthcheck de docker-compose (/api/health)
RUN apk add --no-cache curl

WORKDIR /app

# Instalar dependencias de producción primero (mejor cache de capas)
COPY package*.json ./
RUN npm ci --omit=dev

# Código de la app
COPY . .

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server.js"]
