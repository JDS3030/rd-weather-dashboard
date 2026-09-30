# Proceso 2 — Autenticación y Autorización

> **Agente asignado:** `general-purpose`
> **Modo:** Implementación (puede escribir código).
> **Estado:** Pendiente
> **Dependencias:** Requiere el plan aprobado del **Proceso 1**.

---

## Objetivo
Agregar un *guard* (middleware) y la validación de tokens al endpoint objetivo usando el
mecanismo estándar del stack, de modo que **solo usuarios válidos y autorizados** puedan usarlo.

## Contexto del proyecto (NubeVigía RD)
- **Stack:** Node.js 20 + Express 4 (`backend/`).
- **Mecanismo de auth propuesto:** JWT (Bearer token) vía middleware Express.
  - Alternativa mínima para práctica: API key en header (`x-api-key`) validada contra variable de entorno.
  - ⚠️ **Confirmar con el usuario** cuál usar al iniciar.
- **Convenciones obligatorias del repo:**
  - `'use strict'` en todos los archivos backend.
  - Variables sensibles solo por `.env` (nunca commitear `.env`).
  - Logs con prefijo identificador (p. ej. `[AUTH]`).
  - Commits en español: `tipo: descripción — vX.Y.Z`.

## Endpoint objetivo
`POST /api/alerts/refresh` (o el confirmado en el Proceso 1).

## Instrucciones para el agente (qué hacer al iniciar)
1. Releer el plan aprobado del Proceso 1.
2. Crear el middleware de autenticación (p. ej. `backend/src/middleware/authGuard.js`):
   - Leer el token del header `Authorization: Bearer <token>` (o `x-api-key` si se eligió esa vía).
   - Validar firma/expiración (JWT) o comparar clave (API key).
   - Sin token o token inválido → responder **HTTP 401** con JSON de error coherente con `errorHandler.js`.
3. Aplicar el guard SOLO al endpoint objetivo (no globalmente, para no romper `/api/weather` ni el cron).
4. Añadir variables de entorno necesarias (`JWT_SECRET` o `ALERTS_API_KEY`) al `.env.example` y documentar.
5. Asegurar que el cron interno y el frontend puedan seguir operando (usar la misma clave/token de servicio si aplica).
6. Ejecutar `npm test` en `backend/` para confirmar que no se rompió nada.

## Entregables
- Middleware de autenticación nuevo.
- Endpoint objetivo protegido.
- `.env.example` actualizado + nota en CLAUDE.md si procede.
- Salida de `npm test` sin regresiones.

## Criterios de éxito (Definition of Done)
- [ ] Sin token / token inválido → `401`.
- [ ] Con token válido → acceso normal.
- [ ] `/api/weather` y demás rutas públicas siguen funcionando.
- [ ] El cron de alertas sigue funcionando.
- [ ] La suite Jest existente sigue en verde.

## Qué NO hacer
- No aplicar el guard de forma global sin confirmar impacto.
- No hardcodear secretos en el código.
- No modificar la lógica de negocio de `alertService.js` salvo lo estrictamente necesario.
- No escribir los tests de integración aquí (eso es el Proceso 3).

## Cómo iniciar
El usuario dirá: **"Ejecuta el Proceso 2"**. Se lanza el agente `general-purpose` con este archivo.
