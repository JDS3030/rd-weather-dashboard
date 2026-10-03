# Autohospedaje — NubeVigía RD (Docker Compose + Cloudflare Tunnel)

Guía para correr el stack completo **en tu laptop** y, en el futuro, **moverlo a un
servidor local** sin reconfigurar la app. Reemplaza el hosting en Railway.

## Arquitectura

```
                 ┌─────────────── Cloudflare Tunnel (HTTPS, opcional) ───────────────┐
Internet ──────► │  app.tudominio.com → frontend:80    api.tudominio.com → backend:3001 │
                 └───────────────────────────────────────────────────────────────────┘
                              │ (red interna de docker-compose)
     ┌────────────┐   ┌────────────┐   ┌──────────────────────────┐
     │  frontend  │   │  backend   │   │ python-monitor / -daily  │
     │ nginx :80  │──►│ node :3001 │   │   (perfil "notifiers")   │
     │ (5173→80)  │   │            │   └──────────────────────────┘
     └────────────┘   └────────────┘
```

- **backend** — Node 20 + Express (`:3001`), healthcheck `/api/health`.
- **frontend** — build de Vite servido por nginx (`http://localhost:5173`).
- **cloudflared** — túnel público (perfil `tunnel`, opcional).
- **python-monitor / python-daily** — notificadores Twilio (perfil `notifiers`, opcional).

---

## 1. Requisitos

- **Docker Desktop** (Windows/Mac) o **Docker Engine + Compose** (Linux).
- Los archivos de entorno **no están en git** (hay que tenerlos localmente):
  - `backend/.env` — claves de la app (`WEATHERAPI_KEY`, `JWT_SECRET`, etc.). Ver `backend/.env.example`.
  - `.env` (raíz) — variables del compose. Ver `.env.example`.
  - `scripts/.env` — solo si usas los notificadores. Ver `scripts/.env.example`.

---

## 2. Arranque local (laptop)

```bash
# 1. Copiar las plantillas de entorno (una sola vez)
cp .env.example .env                 # VITE_API_URL, TUNNEL_TOKEN
cp backend/.env.example backend/.env # luego edita las claves reales

# 2. Construir y levantar el núcleo (backend + frontend)
docker compose up -d --build

# 3. Verificar
#    - Frontend:  http://localhost:5173
#    - API:       http://localhost:3001/api/health   → {"status":"ok"...}
```

El `restart: unless-stopped` hace que los contenedores revivan al reiniciar Docker/el equipo.

### Verificación rápida

```bash
curl http://localhost:3001/api/health      # 200
curl http://localhost:3001/api/weather     # 200 (31 provincias)

# Endpoint protegido con JWT
curl -X POST http://localhost:3001/api/alerts/refresh            # 401 (sin token)
TOKEN=$(docker compose exec -T backend node scripts/generate-token.js 1h | tr -d '\r' | tail -1)
curl -X POST -H "Authorization: Bearer $TOKEN" \
     http://localhost:3001/api/alerts/refresh                    # 200
```

---

## 3. Exponerlo a internet — Cloudflare Tunnel (opcional)

Da una URL pública **HTTPS** sin abrir puertos del router. **Requiere un dominio
en Cloudflare** (si no tienes, compra uno barato o usa un *quick tunnel* temporal).

1. **Añade tu dominio a Cloudflare** (dashboard → Add site → cambia los nameservers).
2. **Crea el túnel**: Cloudflare **Zero Trust → Networks → Tunnels → Create a tunnel**
   → *Cloudflared* → ponle nombre → **copia el token** (`TUNNEL_TOKEN`).
3. **Pega el token** en el `.env` de la raíz:
   ```
   TUNNEL_TOKEN=eyJhIjoi...   # el token largo del paso 2
   ```
4. **Define los Public Hostnames** del túnel (en el mismo panel):
   | Hostname               | Service (type → URL)      |
   |------------------------|---------------------------|
   | `api.tudominio.com`    | HTTP → `backend:3001`     |
   | `app.tudominio.com`    | HTTP → `frontend:80`      |

   > Usa los **nombres de servicio** (`backend`, `frontend`): cloudflared vive en la
   > misma red de compose y los resuelve directo.
5. **Apunta el frontend y el CORS a esas URLs**:
   - `.env` (raíz): `VITE_API_URL=https://api.tudominio.com/api`
   - `backend/.env`: `FRONTEND_URL=https://app.tudominio.com`
6. **Reconstruye el frontend** (porque `VITE_API_URL` se hornea en build-time) y
   levanta con el túnel:
   ```bash
   docker compose build frontend
   docker compose --profile tunnel up -d
   ```
7. Listo: `https://app.tudominio.com` queda público con HTTPS.

---

## 4. Migrar al servidor local de casa (futuro)

Como todo es Docker, la migración es casi copiar y pegar:

1. Instala **Docker** en el servidor (Linux recomendado: mini-PC, Raspberry Pi 4/5, PC viejo).
2. Copia el repo **y los `.env`** (no viajan por git):
   ```bash
   git clone https://github.com/JDS3030/rd-weather-dashboard.git
   # copia manualmente: .env, backend/.env, (scripts/.env si aplica)
   ```
3. Arranca igual que en la laptop:
   ```bash
   docker compose --profile tunnel up -d --build
   ```
4. **El túnel se reconecta solo** con el mismo `TUNNEL_TOKEN` — **no cambias DNS ni
   hostnames**. Apaga la laptop y el servidor toma el relevo.

> Sugerencia: en el server, deja Docker como servicio al inicio para que todo
> levante tras un corte de luz.

---

## 5. Notificadores Python (opcional)

Requieren `scripts/.env` con credenciales Twilio (ver `scripts/.env.example`):

```bash
cp scripts/.env.example scripts/.env   # edita con tus credenciales
docker compose --profile notifiers up -d --build
```

---

## 6. Comandos útiles

```bash
docker compose ps                     # estado de contenedores
docker compose logs -f backend        # logs en vivo del backend
docker compose logs -f cloudflared    # ver conexión del túnel
docker compose down                   # detener todo
docker compose up -d --build          # reconstruir y actualizar tras cambios de código
docker compose pull cloudflared       # actualizar la imagen del túnel
```

### Base de datos (historial de alertas)

El backend funciona **sin** base de datos (el historial simplemente no se persiste).
Si quieres persistencia, levanta un Postgres y define `DATABASE_URL` en `backend/.env`.
Se puede añadir como servicio en `docker-compose.yml` cuando lo necesites.
