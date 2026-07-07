# NubeVigía RD — Contexto para Claude

## Proyecto
Dashboard de monitoreo climático en tiempo real para las **31 provincias** de la República Dominicana.
Versión actual: **v1.3.0** | Autor: JDS3030 | Plataforma escolar: Alterna Academy

## URLs de producción
- **Frontend**: https://frontend-two-gilt-77.vercel.app
- **Backend API**: https://nubevigia-backend-production.up.railway.app/api
- **GitHub**: https://github.com/JDS3030/rd-weather-dashboard

## Stack
| Capa | Tecnología |
|------|-----------|
| Backend | Node.js 20 + Express 4 (`backend/`) |
| Frontend | React 18 + Vite + TailwindCSS (`frontend/`) |
| Deploy backend | Railway (`backend/railway.toml`) |
| Deploy frontend | Vercel (`frontend/vercel.json`, auto-deploy desde GitHub) |
| Tests backend | Jest 29 (`backend/__tests__/`) |
| Tests frontend | Vitest + MSW (`frontend/src/__tests__/`) |

## Arquitectura de datos meteorológicos
```
WeatherAPI.com (primario, requiere WEATHERAPI_KEY)
    ↓ falla
Open-Meteo (fallback gratuito, sin clave)
```
- `weatherProviderService.js` — orquestador, decide qué fuente usar
- `weatherApiComService.js` — cliente WeatherAPI.com (`/forecast.json`, 3 días)
- `openMeteoService.js` — cliente Open-Meteo (siempre disponible)
- `openWeatherService.js` — cliente OpenWeather (alternativa futura)

## Servicios clave del backend
```
backend/src/
├── config/constants.js        ← RD_PROVINCES (31 provincias con lat/lon/query)
├── db/
│   ├── pool.js                ← Pool pg singleton; isEnabled()/query(); null sin DATABASE_URL
│   └── init.js                ← ensureSchema() — CREATE TABLE IF NOT EXISTS al arrancar
├── repositories/
│   └── alertHistoryRepository.js  ← insert()/getRecent() del historial (no-op sin DB)
├── services/
│   ├── weatherProviderService.js  ← PUNTO DE ENTRADA para datos del clima
│   ├── weatherApiComService.js    ← WeatherAPI.com (primario)
│   ├── openMeteoService.js        ← Open-Meteo (fallback)
│   ├── alertService.js            ← orquesta fetch + cache + alertas
│   ├── alertDetector.js           ← detecta huracanes, viento, keywords
│   └── onaMetService.js           ← boletines ONAMET (simulados)
├── controllers/
│   ├── weatherController.js   ← usa weatherProviderService
│   └── alertController.js
├── utils/
│   ├── weatherCache.js        ← TTL 5 min, marca stale si API falla
│   ├── weatherParser.js       ← WMO codes → texto español
│   └── logger.js              ← Winston, logs en /backend/logs/
└── middleware/errorHandler.js
```

## Endpoints de la API
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/weather` | 31 provincias (con cache) |
| GET | `/api/weather/:provinceId` | Provincia individual |
| GET | `/api/alerts/status` | Estado de alertas |
| GET | `/api/alerts/history` | Historial de cambios de nivel (PostgreSQL; `?limit=50`, tope 200) |
| POST | `/api/alerts/refresh` | Forzar actualización |
| GET | `/api/reports/latest` | Último reporte diario |

## Variables de entorno

### Backend (`backend/.env`)
```
PORT=3001
FRONTEND_URL=https://frontend-two-gilt-77.vercel.app
WEATHERAPI_KEY=<clave de weatherapi.com>         ← fuente primaria
OPENWEATHER_API_KEY=<clave de openweathermap>    ← no activa aún
ONAMET_SIMULATE_EMERGENCY=false
ONAMET_SIMULATE_WATCH=false
DATABASE_URL=<postgres de Railway>               ← opcional; sin ella no persiste historial
NODE_ENV=development
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:3001/api   ← local
# En Vercel usar: https://nubevigia-backend-production.up.railway.app/api
```

## Comandos de desarrollo
```bash
# Backend
cd backend && npm run dev        # nodemon en :3001
cd backend && npm test           # Jest
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run dev       # Vite en :5173
cd frontend && npx vitest run

# Deploy manual backend
cd backend && railway up --detach

# Ver logs de Railway
cd backend && railway logs --tail 50

# Variables de Railway
cd backend && railway variables
cd backend && railway variables set KEY=valor
```

## Formato de datos de provincia
```js
{
  id, name, region, lat, lon,
  current: {
    temp_c, feelslike_c, humidity, wind_kph, wind_dir,
    pressure_mb, vis_km, uv, precip_mm, cloud,
    condition: { text, code, icon }
  },
  forecast: [{ date, maxtemp_c, mintemp_c, avgtemp_c,
               daily_chance_of_rain, totalprecip_mm, maxwind_kph, condition }],
  alerts: [],
  lastUpdated: ISO string,
  source: 'WeatherAPI.com' | 'Open-Meteo · GFS/ECMWF'
}
```

## Sistema de alertas
- **Niveles**: `normal` → `watch` → `warning` → `emergency`
- **Detección**: keywords en `condition.text` + umbrales de viento (≥63 km/h tormenta, ≥119 km/h huracán)
- **ONAMET**: simulado via `ONAMET_SIMULATE_EMERGENCY=true`
- **Cron**: verifica alertas cada 5 min; reporte diario a las 7 AM

## Convenciones del proyecto
- `'use strict'` en todos los archivos backend
- Logs con prefijo `[PROVIDER]`, `[OpenWeather]`, `[WeatherAPI]` para identificar fuente
- Nunca subir `.env` (está en `.gitignore`)
- Commits en español, formato: `tipo: descripción — vX.Y.Z`
- SemVer: PATCH = fix/docs, MINOR = feature, MAJOR = breaking change

## Historial de versiones
| Versión | Descripción |
|---------|-------------|
| v1.0.0 | Deploy inicial Railway + Vercel |
| v1.2.0 | Arquitectura modular, 31 provincias |
| v1.3.0 | WeatherAPI.com primario + fallback Open-Meteo |
