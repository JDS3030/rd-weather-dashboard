# NubeVigía RD — Hoja de Ruta de Mejoras

> Última actualización: **v1.4.0** (07/07/2026)
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
- [x] Badge "Sin cobertura API" en `CardinalQuadrant` cuando `weather === null`. *(24/06/2026)*

---

## v1.3.0 — Minor (completado ✅)

- [x] **WeatherAPI.com como fuente primaria** + fallback automático a Open-Meteo. *(24/06/2026)*
- [x] **Sistema de fallback**: `weatherProviderService.js` orquesta fuentes con logs `[PROVIDER]`. *(24/06/2026)*
- [x] **Variables de entorno**: `WEATHERAPI_KEY` en Railway. *(24/06/2026)*

---

## v1.3.1 — Patch (completado ✅)

- [x] **Backend migrado a Vitest 4** con reporte HTML de resultados y cobertura. *(27/06/2026)*
- [x] **Hook PostToolUse**: ejecuta tests automáticamente al editar `.js/.ts/.jsx/.tsx`. *(27/06/2026)*
- [x] **176/176 tests pasando** (139 backend + 37 frontend). *(27/06/2026)*

---

## v1.4.0 — Minor (en progreso 🔄)

Features que añaden valor sin romper nada existente.

### UX / Carga ✅
- [x] **Toggle oscuro / claro**: `ThemeContext` con `localStorage`, botón sol/luna en header, `darkMode: 'class'` en Tailwind. Persiste entre sesiones. *(07/07/2026)*
- [x] **Skeleton de carga**: `SkeletonDashboard` reemplaza el spinner — replica el layout completo (header, 4 stats, 4 zona-botones, 2×2 cuadrantes con filas de provincia, sidebar). Oscuro y claro. *(07/07/2026)*
- [x] **Fix dark mode en modal**: `dark:bg-white/N` → `dark:bg-gray-700/N` en `ProvinceModal`, `CardinalQuadrant` y `CardinalDashboard` (Tailwind JIT no generaba `white/N`). *(07/07/2026)*

### Pronóstico ✅
- [x] **Pronóstico extendido 3 días**: tarjetas HOY/MAÑANA/día en `ProvinceModal` con max°/min°, barra de lluvia %, precipitación mm y viento. Mini-dots de lluvia en filas de `CardinalQuadrant`. *(07/07/2026)*

### Infraestructura / CI ✅
- [x] **Fix CI**: quitar `--forceExit` de Vitest en workflow, renombrar job a "Vitest". *(07/07/2026)*
- [x] **Fix tests `useTheme`**: fallback `{ isDark: true }` cuando no hay `ThemeProvider`. *(07/07/2026)*
- [x] **Deploy Vercel corregido**: `vercel --prod --force` para limpiar caché de build. *(07/07/2026)*

### Alertas e Historial ✅
- [x] **Historial de alertas**: `useAlertHistory` persiste últimos 10 cambios de nivel en `localStorage`; `AlertPanel` con tabs "Activas / Historial" y botón limpiar. *(07/07/2026)*
- [x] **Notificaciones push browser**: `useNotifications` + botón campana en Header — solicita permiso y dispara `Notification` cuando el nivel de alerta escala o de-escala. *(07/07/2026)*

### Mapa ✅
- [x] **Mapa interactivo Leaflet**: vista "🗺️ Mapa" en `CardinalDashboard` (toggle Grid/Mapa); marcadores coloreados por temperatura o nivel de alerta para las 31 provincias; lazy load (chunk 150KB bajo demanda); leyenda + tooltips con clima. *(07/07/2026)*

### Pendiente 🔲
- [ ] **Geolocalización mejorada**: scroll automático al cuadrante del usuario al detectar ubicación. *(24/06/2026)*
- [ ] Soporte `aria-label` en todos los botones interactivos (WCAG 2.1 AA). *(24/06/2026)*
- [ ] **Integración real con ONAMET**: scraper de `onamet.gob.do` con cheerio/puppeteer. *(24/06/2026)*
- [ ] **Email de emergencia**: Twilio SendGrid. *(24/06/2026)*
- [ ] Coordenadas precisas a nivel municipal. *(24/06/2026)*

---

## v1.5.0 — Minor (infraestructura)

- [ ] **WebSockets** (`socket.io`): reemplazar polling HTTP cada 5 min. *(24/06/2026)*
- [ ] **PostgreSQL**: persistir historial de alertas y reportes (Railway ya lo ofrece). *(24/06/2026)*
- [ ] **Redis**: caché compartido entre instancias del backend. *(24/06/2026)*
- [ ] **Tests E2E**: Playwright para flujos críticos. *(24/06/2026)*
- [ ] **Rate limiting por usuario**: soportar NAT compartido. *(24/06/2026)*

---

## v2.0.0 — Major

- [ ] Microservicios: `weather-service`, `alert-service`, `notification-service`. *(24/06/2026)*
- [ ] API a JSON:API o GraphQL. *(24/06/2026)*
- [ ] i18n: inglés + español. *(24/06/2026)*

---

## Registro de versiones

| Versión | Fecha      | Tipo  | Descripción                                                              |
|---------|------------|-------|--------------------------------------------------------------------------|
| v1.0.0  | 2026-06-23 | Major | Deploy inicial en Railway + Vercel                                       |
| v1.1.0  | 2026-06-24 | Minor | Rediseño del dashboard por puntos cardinales                             |
| v1.2.0  | 2026-06-24 | Minor | Arquitectura modular + corrección de provincias/municipios               |
| v1.2.1  | 2026-06-24 | Patch | Documentación: MEJORAS.md con hoja de ruta                              |
| v1.2.2  | 2026-06-24 | Patch | Fix: 31 provincias completas                                             |
| v1.2.3  | 2026-06-24 | Patch | vercel.json auto-deploy, .gitignore limpio, badge "Sin datos"            |
| v1.3.0  | 2026-06-24 | Minor | WeatherAPI.com primario + fallback Open-Meteo                            |
| v1.3.1  | 2026-06-27 | Patch | Migración a Vitest, reporte HTML, 176 tests                              |
| v1.4.0  | 2026-07-07 | Minor | Toggle oscuro/claro, pronóstico 3 días, skeleton de carga, fix dark mode |

---

> **Criterio de versionado (SemVer):**
> `PATCH` → correcciones, documentación, config. `MINOR` → features retrocompatibles. `MAJOR` → breaking changes.
