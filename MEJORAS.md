# NubeVigía RD — Hoja de Ruta de Mejoras

> Documento generado tras el cierre de **v1.2.0**.  
> Clasifica las mejoras pendientes por versión sugerida y prioridad.

---

## v1.2.1 — Patch (correcciones menores, sin features nuevas)

Cambios pequeños que no agregan funcionalidad pero mejoran la estabilidad o la experiencia.

- [ ] Agregar `vercel.json` en `frontend/` con `"github": { "enabled": true }` para que Vercel auto-depliegue desde cada push a `master` sin necesidad de `vercel --prod` manual.
- [ ] Mover `test-report.html` a `.gitignore` (es un artefacto generado, no debe versionarse).
- [ ] Agregar `preview-dashboard-*.html` y `ojo/` a `.gitignore`.
- [ ] Mostrar badge "Sin cobertura API" en `CardinalQuadrant` cuando `weather === null`, en lugar de silencio visual.
- [ ] Unificar el mensaje de tooltip en tarjetas de municipio: aclarar que el dato es provincial (ya se hizo en código pero falta en el texto visible de la UI).

---

## v1.3.0 — Minor (nuevas funcionalidades)

Features que añaden valor sin romper nada existente.

### Cobertura geográfica
- [ ] Completar las **32 provincias** de la República Dominicana en `RD_PROVINCES` (actualmente 15 de 32). Prioridad alta para el cuadrante Sur que tiene muchas provincias sin monitoreo real.
- [ ] Agregar coordenadas precisas de municipios para poder llamar la API Open-Meteo a nivel municipal en lugar de reutilizar el dato provincial.

### Dashboard
- [ ] **Modo mapa interactivo**: mostrar las provincias sobre un SVG o mapa Leaflet.js con color según temperatura o nivel de alerta.
- [ ] **Pronóstico extendido**: mostrar los 3 días de forecast ya disponibles en la API (`forecast[]`) de forma visual (gráfico de líneas o cards de días).
- [ ] **Historial de alertas**: guardar en localStorage (o backend) los últimos 10 cambios de estado de alerta para mostrar un log en la UI.
- [ ] **Geolocalización mejorada**: mostrar la provincia del usuario resaltada en el mapa y hacer scroll automático a su cuadrante cardinal.

### Notificaciones
- [ ] **Integración real con ONAMET**: reemplazar el simulador en `onaMetService.js` por un scraper real de `onamet.gob.do` con cheerio o puppeteer.
- [ ] **Notificaciones push en browser**: usar la Web Notifications API para alertar al usuario cuando el nivel de alerta cambia, sin necesidad de WhatsApp.
- [ ] **Email de emergencia**: alternativa o complemento a WhatsApp via Twilio SendGrid.

### UX / Accesibilidad
- [ ] Modo oscuro / claro toggle (actualmente solo oscuro).
- [ ] Soporte `aria-label` en todos los botones interactivos del Dashboard para cumplir WCAG 2.1 AA.
- [ ] Pantalla de carga (skeleton) durante el primer fetch en lugar del spinner genérico.

---

## v1.4.0 — Minor (mejoras de infraestructura)

Cambios más grandes que requieren más tiempo de planificación.

- [ ] **WebSockets**: reemplazar el polling HTTP cada 5 min por un canal WebSocket (`socket.io`) para actualizaciones en tiempo real sin latencia de intervalo.
- [ ] **Base de datos**: persistir el historial de alertas y reportes en PostgreSQL (Railway ya lo ofrece) en lugar de la memoria del proceso. Actualmente se pierden al reiniciar el servidor.
- [ ] **Caché Redis**: mover el `WeatherCache` de memoria a Redis para que múltiples instancias del backend compartan el mismo caché.
- [ ] **Tests E2E**: agregar Playwright o Cypress para flujos críticos (carga del dashboard, apertura de modal, modo emergencia).
- [ ] **Rate limiting por usuario**: mejorar el rate limit actual (por IP) para soportar usuarios detrás de NAT compartido.

---

## v2.0.0 — Major (solo si hay cambio de arquitectura)

Reservado para cambios que rompen la API actual o requieren migración de datos.

- [ ] Separar el backend en microservicios: `weather-service`, `alert-service`, `notification-service`.
- [ ] Cambiar el formato de respuesta de la API a JSON:API o GraphQL.
- [ ] Internacionalización (i18n): soporte para inglés además del español.

---

## Registro de versiones

| Versión | Fecha      | Tipo  | Descripción                                              |
|---------|------------|-------|----------------------------------------------------------|
| v1.0.0  | 2026-06-23 | Major | Deploy inicial en Railway + Vercel                       |
| v1.1.0  | 2026-06-24 | Minor | Rediseño del dashboard por puntos cardinales             |
| v1.2.0  | 2026-06-24 | Minor | Arquitectura modular + corrección de provincias/municipios |
| v1.2.1  | pendiente  | Patch | Documentación, `.gitignore` y badge "Sin cobertura"      |
| v1.3.0  | pendiente  | Minor | 32 provincias + mapa interactivo + pronóstico extendido  |

---

> **Criterio de versionado (SemVer):**  
> `PATCH` → solo correcciones y documentación, sin features.  
> `MINOR` → nuevas funcionalidades retrocompatibles.  
> `MAJOR` → cambios que rompen la API o requieren migración.
