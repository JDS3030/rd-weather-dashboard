# Proceso 4 — Reto Extra: Revocación de tokens ("Sign out all devices")

> **Agente asignado:** `Plan`
> **Modo:** Investigación y diseño de arquitectura. SOLO LECTURA (no implementa).
> **Estado:** Pendiente
> **Dependencias:** Conceptual. Ideal tras el Proceso 2, pero puede analizarse de forma independiente.

---

## Objetivo
Analizar el escenario **"Sign out all devices"** y diseñar cómo implementar la **revocación activa
de tokens** en todos los dispositivos dentro del esquema del proyecto.

## Preguntas a responder
1. ¿Sigue siendo válido un JWT/sesión **después de cambiar la contraseña**? ¿Por qué?
2. ¿Por qué un JWT clásico (stateless) no se puede "invalidar" por sí solo antes de expirar?
3. ¿Cómo se implementa la **revocación activa** en todos los dispositivos?

## Contexto del proyecto (NubeVigía RD)
- **Stack:** Node.js 20 + Express 4.
- **Persistencia disponible:** PostgreSQL opcional vía `backend/src/db/pool.js`
  (patrón singleton, `isEnabled()`/`query()`; hay `ensureSchema()` en `db/init.js`).
  Ya existe la tabla `alert_history` como referencia de estilo.
- **Sin base de datos** el proyecto degrada a no-op; tenerlo en cuenta en el diseño.

## Instrucciones para el agente (qué hacer al iniciar)
1. Explicar la teoría: JWT stateless vs sesiones con estado; por qué la contraseña sola no invalida un JWT.
2. Investigar y comparar estrategias de revocación (con pros/contras para este stack):
   - **Denylist / blocklist** de tokens (o `jti`) en PostgreSQL o Redis.
   - **`tokenVersion` / `passwordChangedAt`** por usuario: invalidar todos los tokens emitidos antes de un instante.
   - **Refresh tokens** de vida corta + rotación, con access tokens breves.
3. Recomendar la opción más coherente con el esquema actual (PostgreSQL opcional, Express).
4. Diseñar el modelo de datos necesario (p. ej. columna `token_version` o tabla `revoked_tokens`).
5. Esbozar el flujo "Sign out all devices" paso a paso (qué pasa al cambiar contraseña / al pulsar el botón).
6. Señalar el impacto en rendimiento y el trade-off stateless vs stateful.

## Entregables
- Documento de análisis con respuestas a las 3 preguntas.
- Comparativa de estrategias con recomendación justificada.
- Diseño de modelo de datos y flujo propuesto (sin implementarlo).

## Criterios de éxito (Definition of Done)
- [ ] Queda claro por qué un JWT sobrevive al cambio de contraseña por defecto.
- [ ] Hay una recomendación concreta y adecuada al stack.
- [ ] El diseño encaja con `pool.js` (PostgreSQL opcional) o justifica añadir Redis.

## Qué NO hacer
- No implementar código (es diseño/investigación).
- No proponer romper el modo "sin base de datos" sin advertirlo.

## Cómo iniciar
El usuario dirá: **"Ejecuta el Proceso 4"**. Se lanza el agente `Plan` con este archivo.
