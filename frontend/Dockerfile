# Frontend — build con Vite y servir estático con nginx
# ── Etapa 1: build ────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# El proyecto usa npm install en el frontend (su package-lock puede estar
# desincronizado; así lo hace también el CI). npm ci fallaría aquí.
COPY package*.json ./
RUN npm install

COPY . .

# VITE_API_URL se inyecta en build-time (Vite lo hornea en el bundle).
# Por defecto apunta al backend local; en producción pásalo como build-arg.
ARG VITE_API_URL=http://localhost:3001/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ── Etapa 2: runtime (nginx) ──────────────────────────────────────
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
