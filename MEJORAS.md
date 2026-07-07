# NubeVigía RD — Hoja de Ruta de Mejoras

> Última actualización: **v1.4.3** (07/07/2026)
> Clasifica las mejoras por versión sugerida y prioridad.

---

## v1.2.x — Patch (completado ✅)

- [x] Documentación: `MEJORAS.md` con hoja de ruta inicial. *(24/06/2026)*
- [x] Completar las **31 provincias** de la RD en `RD_PROVINCES`. *(24/06/2026)*
- [x] `vercel.json` en `frontend/` para auto-deploy. *(24/06/2026)*
- [x] Badge "Sin cobertura API" en `CardinalQuadrant`. *(24/06/2026)*

---

## v1.3.0 — Minor (completado ✅)

- [x] **WeatherAPI.com como fuente primaria** + fallback automático a Open-Meteo. *(24/06/2026)*
- [x] `weatherProviderService.js` con logs `[PROVIDER]`. *(24/06/2026)*
- [x] `WEATHERAPI_KEY` en Railway. *(24/06/2026)*

---

## v1.3.1 — Patch (completado ✅)

- [x] Backend migrado a **Vitest 4** con reporte HTML de resultados y cobertura. *(27/06/2026)*
- [x] Hook PostToolUse: ejecuta tests automáticamente al editar `.js/.ts/.jsx/.tsx`. *(27/06/2026)*
- [x] **176/176 tests pasando** (139 backend + 37 frontend). *(27/06/2026)*

---

## v1.4.0 — Minor (completado ✅)

Todas las features de esta versión están en producción en:
https://frontend-two-gilt-77.vercel.app

### UX / Carga ✅
- [x] **Toggle oscuro/claro**: `ThemeContext` + botón ☀️/🌙 en header. `darkMode: 'class'` en Tailwind. Persiste en `localStorage`. *(07/07/2026)*
- [x] **Skeleton de carga**: `SkeletonDashboard` reemplaza el spinner genérico. Replica el layout completo (header, 4 stats, 4 botones de zona, cuadrícula 2×2 con filas de provincia, sidebar). Funciona en modo oscuro y claro. *(07/07/2026)*
- [x] **Fix dark mode**: `dark:bg-white/N` → `dark:bg-gray-700/N` en `ProvinceModal`, `CardinalQuadrant` y `CardinalDashboard`. Tailwind JIT v3 no generaba las clases `white/N` en producción — causaba fondos blancos en el modal oscuro. *(07/07/2026)*

### Pronóstico ✅
- [x] **Pronóstico extendido 3 días**: tarjetas HOY/MAÑANA/día en `ProvinceModal` con max°/min°, barra de lluvia %, mm y viento. Mini-dots de 3 colores por fila en `CardinalQuadrant`. *(07/07/2026)*

### Alertas y Notificaciones ✅
- [x] **Historial de alertas**: `useAlertHistory` persiste últimos 10 cambios de nivel en `localStorage`. `AlertPanel` con tabs "Activas / Historial" y botón limpiar. *(07/07/2026)*
- [x] **Notificaciones push browser**: `useNotifications` + botón campana en header. Solicita permiso y dispara `Notification` al escalar/de-escalar. *(07/07/2026)*

### Mapa ✅
- [x] **Mapa interactivo Leaflet**: toggle Grid / 🗺️ Mapa en `CardinalDashboard`. 31 marcadores SVG coloreados por temperatura o alerta. Lazy load (chunk 150KB). Tooltips con clima. Clic → abre modal en nivel de provincia (con forecast). *(07/07/2026)*

### Accesibilidad ✅
- [x] **`aria-label` WCAG 2.1 AA**: todos los botones interactivos tienen nombre accesible — refresh, campana (`aria-pressed`), toggle tema (`aria-pressed`), botones de zona, filas de provincia, "Ver detalle →", ×, ← Volver, tabs de alertas (`role="tab"`, `aria-selected`). *(07/07/2026)*

### Geolocalización ✅
- [x] **Geolocalización mejorada**: `scrollIntoView` suave al cuadrante del usuario al detectar ubicación (300ms), luego abre la provincia específica (800ms). *(07/07/2026)*

### Infraestructura / CI ✅
- [x] Fix CI: quitar `--forceExit` de Vitest; renombrar job. *(07/07/2026)*
- [x] Fix tests: fallback `useTheme`, wrapper `ThemeProvider` en `renderWithWeather`. *(07/07/2026)*
- [x] Fix deploy Vercel: `vercel --prod --force` para limpiar caché de build. *(07/07/2026)*
- [x] Fix mapa: `onSelectProvince` usa `normalizeName` + calcula `provinceIdx` para abrir modal en nivel provincia, no zona. *(07/07/2026)*

---

## v1.4.2 — Patch (responsive mobile) — completado ✅

- [x] **`useIsMobile()` hook**: resize listener con debounce 100ms, SSR-safe, breakpoint 768px. *(07/07/2026)*
- [x] **Header responsive**: badge de nivel muestra solo emoji en mobile, texto completo en `sm+`. *(07/07/2026)*
- [x] **Acordeón en CardinalDashboard**: cuadrantes colapsables en mobile con chevron, `Norte` abierto por defecto. *(07/07/2026)*
- [x] **CardinalQuadrant mobile**: cabecera como botón de acordeón, filas con min-h-[44px], barra de calor y humedad ocultas, botón "Ver detalle" dentro del panel desplegado. *(07/07/2026)*
- [x] **Toggle Grid/Mapa ancho completo**: botones `flex-1` en mobile, centrados y sin espacio vacío. *(07/07/2026)*
- [x] **ProvinceModal full-screen**: `inset-0`, `rounded-none`, `100dvh` en mobile. Panel izquierdo oculto, pronóstico 3 días en tarjetas horizontales compactas, botón cerrar en pie. *(07/07/2026)*

---

## v1.4.3 — Patch (testing BDD) — completado ✅

Pruebas de comportamiento (Behavior-Driven Development) para el detector de alertas.

- [x] **Suite BDD con Cucumber.js**: `backend/features/alertDetector.feature` en Gherkin español (`# language: es`) — 54 escenarios / 174 pasos, 100% pasan. Cubre `detectFromWeather` (umbral de viento, texto de condición, alertas oficiales), `detectFromOnamet` y `computeAlertLevel`. *(07/07/2026)*
- [x] **Step definitions CommonJS**: `features/step_definitions/alertDetector.steps.js` con helper `makeProvince`, estado por escenario y aserciones `assert`. *(07/07/2026)*
- [x] **Escenarios clasificados por tag**: `@positivo` (21), `@negativo` (13), `@limite` (20) — incluye Esquemas del escenario para valores frontera (62/63/64 km/h, 118/119/120 km/h). *(07/07/2026)*
- [x] **Reporteros personalizados**: `scripts/generate-bdd-report.js` (HTML oscuro navegable con filtros por categoría) y `scripts/generate-bdd-markdown.js` (reporte Markdown). *(07/07/2026)*
- [x] **Scripts npm**: `test:bdd`, `test:bdd:html` y `test:bdd:report` (corre suite + genera HTML y Markdown). `backend/reports/` gitignored como artefacto generado. *(07/07/2026)*

---

## v1.5.0 — Minor (infraestructura) — PENDIENTE 🔲

Cambios más grandes que requieren planificación adicional.

- [ ] **WebSockets** (`socket.io`): reemplazar polling HTTP cada 5 min por canal en tiempo real. Requiere cambios en backend y frontend. *(24/06/2026)*
- [ ] **PostgreSQL**: persistir historial de alertas y reportes (Railway ya lo ofrece como add-on). Actualmente se pierden al reiniciar el servidor. *(24/06/2026)*
- [ ] **Redis**: caché compartido entre instancias del backend (`WeatherCache` en memoria → Redis). *(24/06/2026)*
- [ ] **Tests E2E**: Playwright/Cypress para flujos críticos (carga dashboard, modal, modo emergencia). *(24/06/2026)*
- [ ] **Rate limiting por usuario**: mejorar el rate limit actual (por IP) para NAT compartido. *(24/06/2026)*

---

## v1.4.1 — Patch (deuda técnica) — completado ✅

Features pequeñas que quedaron pendientes de v1.4.0.

- [x] **Integración real con ONAMET**: `onaMetService.js` reescrito con axios+cheerio, consulta 3 URLs de `onamet.gob.do`, múltiples selectores CSS, extrae severidad y regiones. Fallback simulado preservado vía `ONAMET_SIMULATE_*` o si el scraping falla. *(07/07/2026)*
- [x] **Coordenadas precisas provinciales**: El Seibo corregido a Santa Cruz del Seibo (18.7654, -69.0318); Santo Domingo Provincia ajustado a Santo Domingo Este (18.5058, -69.8690) en `constants.js`. *(07/07/2026)*
- [x] **Pulso visual en mapa con alerta activa**: `MapView.jsx` inyecta animación CSS `nuvigia-pulse-ring` (escala 0.7→2.4, fade 2s) en `document.head` una sola vez; los marcadores con alerta activa muestran el anillo pulsante. *(07/07/2026)*
- [x] **Fix z-index ProvinceModal**: z-50 → z-1000 para cubrir las capas internas de Leaflet (marker-pane z-600, popup-pane z-700) que aparecían encima del modal al hacer clic desde la vista Mapa. *(07/07/2026)*
- [x] **Email de emergencia**: `emailService.js` con SendGrid — envía email a `ALERT_EMAIL_TO` cuando el nivel escala a `warning` o `emergency`. HTML con detonadores, hora RD y enlace al dashboard. Fallo de SendGrid no interrumpe el ciclo de alertas. 11 tests nuevos. *(07/07/2026)*

---

## v2.0.0 — Major (solo si hay cambio de arquitectura)

- [ ] Microservicios: `weather-service`, `alert-service`, `notification-service`. *(24/06/2026)*
- [ ] API a JSON:API o GraphQL. *(24/06/2026)*
- [ ] i18n: inglés + español. *(24/06/2026)*

---

## Registro de versiones

| Versión | Fecha      | Tipo  | Descripción                                                                              |
|---------|------------|-------|------------------------------------------------------------------------------------------|
| v1.0.0  | 2026-06-23 | Major | Deploy inicial en Railway + Vercel                                                       |
| v1.1.0  | 2026-06-24 | Minor | Rediseño del dashboard por puntos cardinales                                             |
| v1.2.0  | 2026-06-24 | Minor | Arquitectura modular + corrección de provincias/municipios                               |
| v1.2.1  | 2026-06-24 | Patch | Documentación: MEJORAS.md con hoja de ruta                                              |
| v1.2.2  | 2026-06-24 | Patch | Fix: 31 provincias completas                                                             |
| v1.2.3  | 2026-06-24 | Patch | vercel.json auto-deploy, .gitignore limpio, badge "Sin datos"                            |
| v1.3.0  | 2026-06-24 | Minor | WeatherAPI.com primario + fallback Open-Meteo                                            |
| v1.3.1  | 2026-06-27 | Patch | Migración a Vitest, reporte HTML, 176 tests                                              |
| v1.4.0  | 2026-07-07 | Minor | Toggle oscuro/claro, pronóstico 3 días, skeleton, historial alertas, notificaciones push, mapa Leaflet, WCAG aria-label, geolocalización mejorada |
| v1.4.1  | 2026-07-07 | Patch | Scraper ONAMET real (cheerio), pulso visual en mapa con alertas, coordenadas precisas, fix z-index ProvinceModal vs Leaflet, email emergencia SendGrid |
| v1.4.2  | 2026-07-07 | Patch | Responsive mobile Galaxy A52s/S21 Ultra — useIsMobile, acordeón cuadrantes, modal full-screen, toggle ancho completo |
| v1.4.3  | 2026-07-07 | Patch | Suite BDD Cucumber.js para alertDetector (54 escenarios), reporteros HTML/Markdown, scripts npm test:bdd:report |

---

> **Criterio de versionado (SemVer):**
> `PATCH` → correcciones, documentación, config sin features.
> `MINOR` → nuevas funcionalidades retrocompatibles.
> `MAJOR` → breaking changes o migración de datos.
