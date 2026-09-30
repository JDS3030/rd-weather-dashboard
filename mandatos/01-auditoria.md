# Proceso 1 — Auditoría de la ruta (Plan Mode)

> **Agente asignado:** `Explore`
> **Modo:** SOLO LECTURA. Prohibido escribir o modificar código en este proceso.
> **Estado:** Pendiente
> **Dependencias:** Ninguna. Es el primer proceso.

---

## Objetivo
Auditar en profundidad el endpoint expuesto y entregar un **plan paso a paso** para asegurarlo,
**antes de tocar una sola línea de código**. Advertir explícitamente cualquier riesgo de romper
la funcionalidad o las reglas de negocio actuales.

## Contexto del proyecto (NubeVigía RD)
- **Stack backend:** Node.js 20 + Express 4 (`backend/`)
- **Autenticación actual:** ❌ NINGUNA. Todos los endpoints son públicos.
- **Estructura relevante:**
  - `backend/src/controllers/alertController.js`
  - `backend/src/services/alertService.js`
  - `backend/src/middleware/errorHandler.js`
  - Rutas de la API (buscar dónde se registran, p. ej. `backend/src/routes/` o `app.js`/`index.js`)

## Endpoint objetivo
- **Por defecto:** `POST /api/alerts/refresh` (fuerza actualización — única ruta de escritura/comando).
- ⚠️ **Confirmar con el usuario al iniciar** si se debe auditar otro endpoint.

## Instrucciones para el agente (qué hacer al iniciar)
1. Localizar dónde se define y registra el endpoint objetivo (ruta, controller, middleware).
2. Documentar el flujo actual de la petición: entrada → controller → service → respuesta.
3. Identificar qué reglas de negocio dependen de que esa ruta sea pública (p. ej. el cron, el frontend, tests).
4. Enumerar los riesgos de seguridad concretos de dejarla sin autenticación.
5. Proponer un **plan de aseguramiento paso a paso** (guard + validación de token) que NO rompa:
   - El cron interno que refresca alertas cada 5 min.
   - Las llamadas del frontend.
   - Los tests existentes (Jest en `backend/__tests__/`).
6. Marcar con ⚠️ cada punto del plan que pueda romper funcionalidad existente y proponer mitigación.

## Entregables
- Mapa del flujo actual del endpoint (archivos + líneas).
- Lista de dependencias/consumidores de la ruta.
- Lista de riesgos de seguridad.
- **Plan paso a paso aprobable** para los Procesos 2 y 3.

## Criterios de éxito (Definition of Done)
- [ ] El plan referencia archivos y líneas reales del repo.
- [ ] Cada cambio propuesto indica si afecta al cron/frontend/tests.
- [ ] No se modificó ningún archivo.
- [ ] El usuario puede aprobar el plan y pasar al Proceso 2.

## Qué NO hacer
- No escribir, editar ni borrar código.
- No instalar dependencias.
- No avanzar a implementación sin aprobación explícita.

## Cómo iniciar
El usuario dirá: **"Ejecuta el Proceso 1"**. Entonces se lanza el agente `Explore` con este archivo como instrucción.
