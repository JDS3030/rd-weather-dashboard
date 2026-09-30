# Proceso 3 — Pruebas de Integración

> **Agente asignado:** `claude`
> **Modo:** Implementación de tests (puede escribir código de pruebas).
> **Estado:** Pendiente
> **Dependencias:** Requiere el endpoint ya protegido del **Proceso 2**.

---

## Objetivo
Escribir pruebas de integración que confirmen el comportamiento de seguridad del endpoint,
**sin modificar ni romper las pruebas existentes** que ya protegen el negocio.

## Contexto del proyecto (NubeVigía RD)
- **Framework de tests backend:** Jest 29 (`backend/__tests__/`).
- **Comandos:**
  - `cd backend && npm test`
  - `cd backend && npm run test:coverage`
- **Convenciones:** `'use strict'`, describir en español, no tocar suites existentes.

## Endpoint objetivo
`POST /api/alerts/refresh` (o el confirmado en el Proceso 1).

## Instrucciones para el agente (qué hacer al iniciar)
1. Revisar la estructura de los tests existentes en `backend/__tests__/` para imitar el estilo.
2. Crear un archivo nuevo (p. ej. `backend/__tests__/alertsRefresh.auth.test.js`).
3. Cubrir al menos estos casos de integración:
   - **a)** Petición SIN token → espera **HTTP 401**.
   - **b)** Petición con token/clave INVÁLIDO → espera **HTTP 401**.
   - **c)** Petición con token/clave VÁLIDO → espera **HTTP 200** y respuesta correcta.
   - **d)** (Opcional) Confirmar que un endpoint público como `/api/weather` sigue accesible sin token.
4. Usar `supertest` contra la app Express (verificar si ya está instalado; si no, proponerlo antes de instalar).
5. Ejecutar toda la suite (`npm test`) y confirmar 0 regresiones.

## Entregables
- Archivo de test nuevo con los casos a/b/c (+ d opcional).
- Salida de `npm test` mostrando la suite completa en verde.

## Criterios de éxito (Definition of Done)
- [ ] Test de "sin token → 401" pasa.
- [ ] Test de "token inválido → 401" pasa.
- [ ] Test de "token válido → 200" pasa.
- [ ] Ninguna prueba existente se modificó ni falló.

## Qué NO hacer
- No editar ni borrar tests existentes.
- No cambiar la lógica de producción para "hacer pasar" un test (si algo falla, reportarlo).
- No commitear secretos reales; usar valores de prueba/mocks.

## Cómo iniciar
El usuario dirá: **"Ejecuta el Proceso 3"**. Se lanza el agente `claude` con este archivo.
