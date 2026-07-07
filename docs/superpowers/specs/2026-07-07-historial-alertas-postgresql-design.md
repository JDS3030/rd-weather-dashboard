# Diseño — Historial de alertas en PostgreSQL

**Proyecto:** NubeVigía RD
**Versión objetivo:** v1.5.0 (MINOR)
**Fecha:** 2026-07-07
**Autor:** JDS3030 (con Claude Code)

---

## 1. Problema

El único historial de cambios de nivel de alerta vive en el **frontend**
(`useAlertHistory.js` → `localStorage`, máx. 10 entradas, por navegador). Esto
implica:

- Cada usuario ve un historial distinto (no es compartido).
- Se pierde al limpiar el navegador o cambiar de dispositivo.
- El backend no conserva ninguna traza histórica: `currentAlertState` en
  `alertService.js` es un objeto en memoria que solo refleja el estado *actual*
  y se reinicia con cada reinicio del proceso en Railway.

**Objetivo:** persistir un historial de alertas *server-side*, compartido entre
todos los usuarios y resistente a reinicios, usando PostgreSQL (add-on de
Railway).

## 2. Alcance

**Dentro:**
- Persistir cada **cambio de nivel de alerta** (en cualquier dirección: escala o
  baja) en una tabla PostgreSQL.
- Endpoint de lectura `GET /api/alerts/history`.
- El frontend lee el historial del backend (con fallback a `localStorage`).

**Fuera (versiones futuras):**
- Persistir reportes diarios/emergencia (siguen en memoria — `reportService.js`).
- Persistir el snapshot del estado actual para restaurarlo al arrancar.
- Redis, WebSockets (otras tareas de v1.5.0).

## 3. Decisiones de diseño

| Decisión | Elección | Motivo |
|----------|----------|--------|
| Qué persistir | Solo historial de alertas | Vacío funcional más real; reportes y estado actual quedan para después. |
| Comportamiento sin DB | **Degradación elegante** | Backend arranca igual sin `DATABASE_URL`; opera sin persistencia. No rompe local ni tests. |
| Acceso a datos | Driver `pg` puro + capa fina de repositorio | Una sola tabla y dos queries; mantiene el backend ligero, sin ORM. Encaja con el estilo minimalista del repo. |
| Schema management | `CREATE TABLE IF NOT EXISTS` al arrancar | Suficiente para una tabla; evita traer Knex/Prisma. |
| Fallback frontend | Mantener `localStorage` como respaldo offline | Preserva la función actual cuando el backend está sin DB o caído. |

## 4. Arquitectura y componentes

```
backend/src/
├── db/
│   ├── pool.js          ← NUEVO: Pool singleton de pg. Lee DATABASE_URL.
│   │                       Si no existe → exporta null (modo sin-DB).
│   └── init.js          ← NUEVO: ensureSchema() — CREATE TABLE IF NOT EXISTS
│                           al arrancar. No-op si pool es null.
├── repositories/
│   └── alertHistoryRepository.js  ← NUEVO: insert(entry), getRecent(limit).
│                                     No-op / [] si pool es null.
├── services/
│   └── alertService.js  ← MODIFICADO: al detectar cambio de nivel, escribe
│                           una fila en el historial (fire-and-forget).
├── controllers/
│   └── alertController.js  ← MODIFICADO: nuevo getAlertHistory.
├── routes/
│   └── alerts.js        ← MODIFICADO: GET /api/alerts/history.
└── server.js            ← MODIFICADO: llama ensureSchema() en el arranque.

frontend/src/
└── hooks/
    └── useAlertHistory.js  ← MODIFICADO: fuente primaria = API backend;
                               fallback = localStorage.
```

**Principio de aislamiento:** el "modo sin-DB" se concentra en dos lugares:
`pool.js` (devuelve `null` cuando no hay `DATABASE_URL`) y el repositorio (si
`pool` es null, `insert` no hace nada y `getRecent` devuelve `[]`). El resto del
código llama al repositorio sin saber si hay DB o no.

## 5. Modelo de datos

```sql
CREATE TABLE IF NOT EXISTS alert_history (
  id            BIGSERIAL PRIMARY KEY,
  from_level    TEXT        NOT NULL,          -- normal|watch|warning|emergency
  to_level      TEXT        NOT NULL,
  trigger_count INTEGER     NOT NULL DEFAULT 0,
  province      TEXT,                          -- provincia del primer trigger (nullable)
  triggers      JSONB       NOT NULL DEFAULT '[]', -- snapshot para auditoría
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alert_history_created_at
  ON alert_history (created_at DESC);
```

Refleja los campos que hoy guarda el frontend (`from`, `to`, `triggers`,
`province`, `timestamp`), más un `triggers` JSONB completo para auditoría. El
índice en `created_at DESC` hace eficiente la consulta "últimos N".

## 6. Flujo de datos

### Escritura (en `alertService.checkAndUpdateAlertStatus`)

```
Se calcula el nuevo nivel
  → ¿cambió respecto al anterior? (cualquier dirección: escala o baja)
      → sí: alertHistoryRepository.insert({
               fromLevel, toLevel, triggerCount, province, triggers
             })
            (fire-and-forget: un fallo de DB NO interrumpe el ciclo de
             alertas — se captura y loguea con prefijo [DB])
```

Se registra **todo cambio de nivel**, no solo las escaladas (consistente con el
comportamiento actual del frontend, que registra ambas direcciones). La
condición de cambio es `level !== prevLevel`.

### Lectura

```
GET /api/alerts/history?limit=50
  → controller.getAlertHistory
  → alertHistoryRepository.getRecent(limit)
  → SELECT id, from_level, to_level, trigger_count, province, triggers, created_at
    FROM alert_history ORDER BY created_at DESC LIMIT $1
```

## 7. API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/alerts/history?limit=50` | Últimos N cambios de nivel |

**Parámetros:** `limit` (default 50, mínimo 1, máximo 200; valores fuera de
rango se recortan al tope).

**Respuesta (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "id": 42,
      "from": "warning",
      "to": "emergency",
      "triggerCount": 3,
      "province": "Monte Cristi",
      "triggers": [ /* snapshot */ ],
      "createdAt": "2026-07-07T18:30:00.000Z"
    }
  ]
}
```

**Sin DB:** `{ "success": true, "count": 0, "data": [] }` (200 OK, no error).

## 8. Frontend

`useAlertHistory.js`:
- **Fuente primaria:** `fetch(\`${VITE_API_URL}/alerts/history\`)` al montar y
  cuando cambia `alertState.level` (para refrescar tras un cambio).
- **Fallback offline:** si la petición falla o el backend responde vacío por
  falta de DB, se usa `localStorage` con la lógica actual (diff de nivel
  client-side). No se elimina el código existente.
- **Mapeo de campos:** la respuesta del backend (`createdAt`, `triggerCount`) se
  adapta a la forma que consume `AlertPanel` (`timestamp`, `triggers`) para no
  tocar la UI.

`AlertPanel.jsx`: sin cambios de UI; solo recibe los datos ya mapeados por el
hook.

## 9. Manejo de errores / degradación

| Situación | Comportamiento |
|-----------|----------------|
| Sin `DATABASE_URL` | `pool = null`. `ensureSchema` no-op con log `[DB] Sin DATABASE_URL — persistencia deshabilitada`. |
| Postgres caído al insertar | `insert` captura el error, lo loguea con prefijo `[DB]`, y **no** interrumpe el ciclo de alertas (mismo patrón que SendGrid en `emailService`). |
| Postgres caído al leer | `getRecent` captura, loguea `[DB]`, devuelve `[]`. Frontend cae a `localStorage`. |
| `DATABASE_URL` de Railway | Conexión con `ssl: { rejectUnauthorized: false }` habilitado condicionalmente (según entorno). |

## 10. Testing

- **Repositorio** (`alertHistoryRepository`): tests Vitest mockeando el módulo
  `pool` (`vi.mock`). Verifican:
  - `insert` construye la query y parámetros correctos.
  - `getRecent` construye el `SELECT ... LIMIT` y mapea filas a la forma de API.
  - Modo sin-DB (`pool === null`): `insert` es no-op, `getRecent` devuelve `[]`.
- **alertService:** un cambio de nivel dispara `insert` (repo mockeado); un
  fallo del repo **no** rompe `checkAndUpdateAlertStatus`.
- **Controller/ruta:** `GET /api/alerts/history` con supertest (repo mockeado),
  incluye validación del `limit`.
- **Regresión:** como el modo por defecto (sin `DATABASE_URL`) es sin-DB, la
  suite actual (189 tests backend) sigue verde sin Postgres instalado.

## 11. Configuración y despliegue

- **Nueva dependencia:** `pg`.
- **Variable de entorno:** `DATABASE_URL` (Railway la inyecta automáticamente al
  añadir el add-on PostgreSQL). Se documenta en `CLAUDE.md` y el `.env` de
  ejemplo.
- **Railway:** añadir el add-on PostgreSQL al proyecto backend. `ensureSchema`
  crea la tabla en el primer arranque.
- **Versión:** v1.5.0. Se registra en `MEJORAS.md` (marca la tarea de
  PostgreSQL como completada) y en la memoria del proyecto.

## 12. Criterios de aceptación

1. Con `DATABASE_URL` configurada, un cambio de nivel de alerta inserta una fila
   en `alert_history`.
2. `GET /api/alerts/history` devuelve los cambios en orden descendente por
   fecha, respetando `limit`.
3. El frontend muestra el historial del backend; si el backend no responde,
   cae a `localStorage` sin errores visibles.
4. Sin `DATABASE_URL`, el backend arranca, opera normal y la suite de tests pasa
   sin Postgres.
5. Un fallo de PostgreSQL (insert o read) nunca interrumpe el ciclo de alertas
   ni tumba el servidor.
