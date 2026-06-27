# NubeVigía RD — Hoja de Ruta de Mejoras

> Última actualización: **v1.3.0**  
> Clasifica las mejoras por versión sugerida y prioridad.

---

## v1.2.x — Patch (completado ✅)

### v1.2.1
- [x] Documentación: `MEJORAS.md` con hoja de ruta inicial. *(24/06/2026)*

### v1.2.2
- [x] Completar las **31 provincias** de la RD en `RD_PROVINCES` — Norte, Este y Sur sin datos en blanco. *(24/06/2026)*

### v1.2.3
- [x] Agregar `vercel.json` en `frontend/` con `"github": { "enabled": true }` para auto-deploy desde push. *(24/06/2026)*
- [x] Mover `test-report.html` y `jest-results.json` a `.gitignore` (artefactos generados). *(24/06/2026)*
- [x] Agregar `preview-dashboard-*.html` y `ojo/` a `.gitignore`. *(24/06/2026)*
- [x] Badge "Sin cobertura API" en `CardinalQuadrant` cuando `weather === null`. *(24/06/2026)*

---

## v1.3.0 — Minor (completado ✅)

### Integración de API meteorológica real con fallback
- [x] **WeatherAPI.com como fuente primaria**: nuevo `weatherApiComService.js` que obtiene clima actual + pronóstico de 3 días en una sola llamada por provincia. *(24/06/2026)*
- [x] **Sistema de fallback automático**: nuevo `weatherProviderService.js` que intenta WeatherAPI.com primero y recurre a Open-Meteo si la API falla (total o parcialmente). *(24/06/2026)*
- [x] **openWeatherService.js**: soporte alternativo para OpenWeather API (preparado para uso futuro). *(24/06/2026)*
- [x] **Variables de entorno**: `WEATHERAPI_KEY` documentada en `.env.example` y configurada en Railway. *(24/06/2026)*
- [x] **Logs de diagnóstico**: prefijo `[PROVIDER]` en consola indica qué fuente está activa en cada ciclo. *(24/06/2026)*
- [x] **README actualizado**: refleja 31 provincias, arquitectura dual y nueva tabla de stack. *(24/06/2026)*

---

## v1.3.1 — Patch (completado ✅)

### Migración de tests a Vitest con reporte HTML automático
- [x] **Backend migrado a Vitest 4**: reemplaza Jest 29 como runner activo; instala `vitest`, `@vitest/coverage-v8` y `@vitest/ui`. *(27/06/2026)*
- [x] **Reporte HTML de resultados**: `vitest.config.mjs` configura reporters `verbose + html` → genera `backend/html/index.html` con cada ejecución. *(27/06/2026)*
- [x] **Reporte HTML de cobertura**: genera `backend/coverage/index.html` con métricas de líneas, funciones y ramas cubiertas. *(27/06/2026)*
- [x] **Hook PostToolUse automático**: `.claude/settings.local.json` ejecuta `vitest run --coverage` en backend y frontend cada vez que se edita un archivo `.js/.ts/.jsx/.tsx`, garantizando que los tests siempre estén al día. *(27/06/2026)*
- [x] **Tests nuevos**: `weatherApiComService.test.js` y `weatherProviderService.test.js` — 73 tests adicionales cubren mapeo de datos, verificación de campos, manejo de errores y lógica de fallback. *(27/06/2026)*
- [x] **176/176 tests pasando** (139 backend + 37 frontend). *(27/06/2026)*

---

## v1.4.0 — Minor (próxima versión sugerida)

Features que añaden valor sin romper nada existente.

### Cobertura geográfica
- [ ] Agregar coordenadas precisas de municipios para llamar la API a nivel municipal en lugar de reutilizar el dato provincial. *(24/06/2026)*

### Dashboard
- [ ] **Modo mapa interactivo**: mostrar las provincias sobre un SVG o mapa Leaflet.js con color según temperatura o nivel de alerta. *(24/06/2026)*
- [ ] **Pronóstico extendido**: mostrar los 3 días de forecast ya disponibles en la API (`forecast[]`) de forma visual (gráfico de líneas o cards de días). *(24/06/2026)*
- [ ] **Historial de alertas**: guardar en localStorage (o backend) los últimos 10 cambios de estado de alerta para mostrar un log en la UI. *(24/06/2026)*
- [ ] **Geolocalización mejorada**: mostrar la provincia del usuario resaltada en el mapa y hacer scroll automático a su cuadrante cardinal. *(24/06/2026)*

### Notificaciones
- [ ] **Integración real con ONAMET**: reemplazar el simulador en `onaMetService.js` por un scraper real de `onamet.gob.do` con cheerio o puppeteer. *(24/06/2026)*
- [ ] **Notificaciones push en browser**: usar la Web Notifications API para alertar al usuario cuando el nivel de alerta cambia, sin necesidad de WhatsApp. *(24/06/2026)*
- [ ] **Email de emergencia**: alternativa o complemento a WhatsApp via Twilio SendGrid. *(24/06/2026)*

### UX / Accesibilidad
- [ ] Modo oscuro / claro toggle (actualmente solo oscuro). *(24/06/2026)*
- [ ] Soporte `aria-label` en todos los botones interactivos del Dashboard para cumplir WCAG 2.1 AA. *(24/06/2026)*
- [ ] Pantalla de carga (skeleton) durante el primer fetch en lugar del spinner genérico. *(24/06/2026)*

---

## v1.5.0 — Minor (mejoras de infraestructura)

Cambios más grandes que requieren más tiempo de planificación.

- [ ] **WebSockets**: reemplazar el polling HTTP cada 5 min por un canal WebSocket (`socket.io`) para actualizaciones en tiempo real sin latencia de intervalo. *(24/06/2026)*
- [ ] **Base de datos**: persistir el historial de alertas y reportes en PostgreSQL (Railway ya lo ofrece) en lugar de la memoria del proceso. Actualmente se pierden al reiniciar el servidor. *(24/06/2026)*
- [ ] **Caché Redis**: mover el `WeatherCache` de memoria a Redis para que múltiples instancias del backend compartan el mismo caché. *(24/06/2026)*
- [ ] **Tests E2E**: agregar Playwright o Cypress para flujos críticos (carga del dashboard, apertura de modal, modo emergencia). *(24/06/2026)*
- [ ] **Rate limiting por usuario**: mejorar el rate limit actual (por IP) para soportar usuarios detrás de NAT compartido. *(24/06/2026)*

---

## v2.0.0 — Major (solo si hay cambio de arquitectura)

Reservado para cambios que rompen la API actual o requieren migración de datos.

- [ ] Separar el backend en microservicios: `weather-service`, `alert-service`, `notification-service`. *(24/06/2026)*
- [ ] Cambiar el formato de respuesta de la API a JSON:API o GraphQL. *(24/06/2026)*
- [ ] Internacionalización (i18n): soporte para inglés además del español. *(24/06/2026)*

---

## Registro de versiones

| Versión | Fecha      | Tipo  | Descripción                                                       |
|---------|------------|-------|-------------------------------------------------------------------|
| v1.0.0  | 2026-06-23 | Major | Deploy inicial en Railway + Vercel                                |
| v1.1.0  | 2026-06-24 | Minor | Rediseño del dashboard por puntos cardinales                      |
| v1.2.0  | 2026-06-24 | Minor | Arquitectura modular + corrección de provincias/municipios        |
| v1.2.1  | 2026-06-24 | Patch | Documentación: MEJORAS.md con hoja de ruta                       |
| v1.2.2  | 2026-06-24 | Patch | Fix: 31 provincias completas (Norte, Este, Sur sin datos vacíos)  |
| v1.2.3  | 2026-06-24 | Patch | vercel.json auto-deploy, .gitignore limpio, badge "Sin datos"     |
| v1.3.0  | 2026-06-24 | Minor | WeatherAPI.com como fuente primaria + fallback automático a Open-Meteo |

---

> **Criterio de versionado (SemVer):**  
> `PATCH` → correcciones, documentación, ajustes de config, sin features.  
> `MINOR` → nuevas funcionalidades retrocompatibles.  
> `MAJOR` → cambios que rompen la API o requieren migración.
