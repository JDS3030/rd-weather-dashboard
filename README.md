# NubeVigía RD — Dashboard Climático de la República Dominicana

![Node.js](https://img.shields.io/badge/Node.js-20%2B-brightgreen?logo=node.js)
![Python](https://img.shields.io/badge/Python-3.11%2B-blue?logo=python)
![Tests](https://img.shields.io/badge/Tests-176%20passing-success?logo=vitest)
![License](https://img.shields.io/badge/License-MIT-yellow)
![Version](https://img.shields.io/badge/version-1.3.0-blue)

Dashboard de monitoreo climático en tiempo real para las **31 provincias** de la República Dominicana. Integra datos meteorológicos reales desde **WeatherAPI.com** (fuente primaria) con fallback automático a **Open-Meteo** cuando la API principal no está disponible. Incluye detección automática de eventos severos (huracanes, tormentas tropicales, inundaciones), notificaciones de emergencia vía WhatsApp usando Twilio y reportes diarios generados por scripts Python.

---

## Captura de Pantalla

> [Ver diseño en MeteoRD-Dashboard.pen]

---

## Características

- **31 provincias monitoreadas en tiempo real** (WeatherAPI.com como fuente primaria)
- **Fallback automático** a Open-Meteo si WeatherAPI.com no responde — sin interrupciones para el usuario
- **Modo Normal y Modo Alerta** 🚨 (cambio visual automático)
- **Detección automática** de huracanes, tormentas tropicales e inundaciones
- **Integración con boletines ONAMET** (simulación y producción)
- **Reportes diarios automáticos** a las 7:00 AM
- **Notificaciones WhatsApp via Twilio** (emergencias cada 1 hora)
- **176 tests automatizados** (139 backend + 37 frontend), 100% verde — Vitest + reporte HTML
- **Diseño UI en Pencil** (`MeteoRD-Dashboard.pen`)

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime servidor | Node.js | 20+ |
| Framework servidor | Express | 4 |
| Framework frontend | React | 18.2 |
| Bundler | Vite | 5 |
| Estilos | TailwindCSS | 3.4 |
| Datos meteorológicos (primario) | WeatherAPI.com | — |
| Datos meteorológicos (fallback) | Open-Meteo API | — |
| Scripts automatización | Python | 3.11+ |
| Notificaciones SMS/WhatsApp | Twilio | — |
| Tests backend | Vitest | 4 |
| Tests frontend | Vitest | 4 |
| Mocking HTTP | MSW | 2 |

---

## Diseño y Frontend

El diseño de la interfaz se construyó con **TailwindCSS** sobre una base de **React + Vite**, sin librería de componentes ni de iconos externa (los íconos son **SVG inline** y **emojis** propios).

### Diseño y estilos

| Herramienta | Versión | Uso |
|-------------|---------|-----|
| **TailwindCSS** | ^3.4.0 | Framework de estilos principal (todo el diseño) |
| **PostCSS** | ^8.4.32 | Procesa el CSS de Tailwind |
| **Autoprefixer** | ^10.4.16 | Prefijos de compatibilidad entre navegadores |
| **Inter** (Google Fonts) | — | Tipografía principal (importada en `index.css`) |

**Personalizaciones en `tailwind.config.js`:**

- `darkMode: 'class'` → modo oscuro manual
- Fuente `Inter` como `font-sans`
- Color custom `gray-975: #030712`
- Animaciones propias: `siren` (alertas), `ticker` (cinta de noticias), `fade-down`, `slide-up`, `modal-in`, `pulse-slow`, `ping-slow`

### Base de UI

| Herramienta | Versión | Uso |
|-------------|---------|-----|
| **React** | ^18.2.0 | Biblioteca de componentes |
| **React DOM** | ^18.2.0 | Render en el navegador |
| **Vite** | ^5.0.8 | Build tool / dev server |
| **@vitejs/plugin-react** | ^4.2.1 | Soporte de React en Vite |

### Mapa y datos

| Herramienta | Versión | Uso |
|-------------|---------|-----|
| **Leaflet** | ^1.9.4 | Mapa interactivo de las 31 provincias (`MapView.jsx`, lazy-load) |
| **Axios** | ^1.6.2 | Peticiones HTTP a la API |

### Testing frontend

| Herramienta | Versión | Uso |
|-------------|---------|-----|
| **Vitest** | ^4.1.9 | Runner de tests |
| **@vitest/ui** / **@vitest/coverage-v8** | ^4.1.9 | UI de tests y cobertura |
| **Testing Library** (react / jest-dom / user-event) | — | Utilidades de testing de componentes |
| **MSW** | ^2.14.6 | Mock de la API en tests |
| **jsdom** | ^29.1.1 | Entorno DOM para tests |

### Detalles de diseño notables

- **Iconos**: no se usa librería de iconos (tipo lucide/heroicons). Los íconos son **SVG inline** y **emojis** (ej. el favicon 🌤️ está embebido como SVG en `index.html`).
- **Marcadores del mapa**: SVG generados a mano en `MapView.jsx`.
- **Diseño UI en Pencil** (`MeteoRD-Dashboard.pen`).

---

## Estructura del Proyecto

```
rd-weather-dashboard/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   └── services/
│   ├── __tests__/
│   ├── server.js
│   ├── jest.config.js       ← legacy (conservado)
│   ├── vitest.config.mjs    ← runner activo
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   └── hooks/
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── scripts/
│   ├── emergency_monitor.py
│   ├── daily_report.py
│   ├── whatsapp_notifier.py
│   ├── config.py
│   ├── requirements.txt
│   └── tests/
├── MeteoRD-Dashboard.pen
├── docker-compose.yml
└── render.yaml
```

---

## Prerrequisitos

- **Node.js** 20 o superior — [descargar](https://nodejs.org/)
- **Python** 3.11 o superior — [descargar](https://www.python.org/)
- **npm** (incluido con Node.js)

---

## Instalación y Ejecución

### Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev   # corre en http://localhost:3001
```

### Frontend (nueva terminal)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev   # corre en http://localhost:5173
```

### Scripts Python (nueva terminal)

```bash
cd scripts
cp .env.example .env
pip install -r requirements.txt
python emergency_monitor.py
```

---

## Ejecutar Tests

### Backend (66 tests)

```bash
cd backend && npm test
cd backend && npm run test:coverage
```

### Frontend (37 tests)

```bash
cd frontend && npx vitest run
cd frontend && npx vitest run --coverage
```

### Python (20 tests)

```bash
cd scripts && pytest
```

---

## Modo de Emergencia

Para simular una alerta ONAMET en desarrollo sin necesidad de boletines reales, define la variable de entorno:

```bash
ONAMET_SIMULATE_EMERGENCY=true
```

Cuando esta variable está activa, el backend inyecta automáticamente un boletín de prueba que activa el **Modo Alerta** en la UI (fondo rojo, banner de emergencia) y dispara las notificaciones WhatsApp de emergencia cada 1 hora. Ideal para verificar el flujo completo sin esperar condiciones meteorológicas reales.

---

## Endpoints de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/health` | Estado del servidor |
| `GET` | `/api/weather` | Datos meteorológicos de las 31 provincias |
| `GET` | `/api/alerts/status` | Estado actual de alertas activas |
| `POST` | `/api/alerts/onamet` | Publicar boletín ONAMET (activa modo alerta) |
| `DELETE` | `/api/alerts/onamet` | Eliminar boletín ONAMET activo |
| `GET` | `/api/reports/latest` | Obtener el reporte diario más reciente |
| `POST` | `/api/reports/generate` | Generar reporte diario manualmente |

---

## Arquitectura

```
         ┌──────────────────────┐    ┌──────────────────────┐
         │   WeatherAPI.com     │    │    Open-Meteo API    │
         │  (fuente primaria)   │    │  (fallback gratuito) │
         └──────────┬───────────┘    └──────────┬───────────┘
                    │ HTTP (primero)             │ HTTP (si falla)
                    └────────────┬──────────────┘
                                 │
                  ┌──────────────▼──────────────┐
                  │     Node.js Backend          │
                  │     Express 4 · Puerto 3001  │
                  │  ┌─────────────────────────┐ │
                  │  │  weatherProviderService  │ │
                  │  │  (orquestador fallback)  │ │
                  │  ├─────────────────────────┤ │
                  │  │  Servicio de Alertas    │ │
                  │  │  (ONAMET + detección)   │ │
                  │  └─────────────────────────┘ │
                  └──────┬─────────────┬─────────┘
                                 │ REST API    │ REST API
               ┌─────────────────▼──┐    ┌────▼─────────────────┐
               │   React Frontend   │    │   Python Scripts      │
               │   Vite · Puerto    │    │   emergency_monitor   │
               │   5173             │    │   daily_report        │
               │   TailwindCSS      │    │   whatsapp_notifier   │
               │   Modo Normal /    │    └────────────┬──────────┘
               │   Modo Alerta 🚨   │                 │ SDK
               └────────────────────┘    ┌────────────▼──────────┐
                                         │        Twilio          │
                                         │  WhatsApp / SMS        │
                                         │  Alertas cada 1h       │
                                         └────────────────────────┘
```

---

## Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).

---

## Autor

**JDS3030** — [github.com/JDS3030](https://github.com/JDS3030)
