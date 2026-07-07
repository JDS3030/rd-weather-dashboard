# Email de Emergencia — NubeVigía RD

**Fecha:** 2026-07-07  
**Versión objetivo:** v1.4.1  
**Estado:** Aprobado

---

## Contexto

El sistema ya cuenta con notificaciones push del browser (`useNotifications`). Sin embargo, estas solo funcionan si el usuario tiene el tab abierto. El email complementa ese canal enviando una alerta fuera del browser cuando el nivel escala a `warning` o `emergency`.

---

## Arquitectura

```
alertService.js
  └─ checkAndUpdateAlertStatus()
       └─ nivel sube a warning/emergency
            └─ emailService.sendAlertEmail()
                 └─ SendGrid API → joels9568@gmail.com
```

Todos los cambios son en backend. El frontend no se modifica.

---

## Reglas de disparo

| Transición               | ¿Envía email? |
|--------------------------|---------------|
| normal → warning         | ✅ Sí         |
| normal → emergency       | ✅ Sí         |
| warning → emergency      | ✅ Sí         |
| emergency → warning      | ❌ No         |
| warning → normal         | ❌ No         |
| mismo nivel (sin cambio) | ❌ No         |

Solo escala, nunca de-escala ni nivel repetido.

---

## Variables de entorno

```env
SENDGRID_API_KEY=SG.xxxxx
ALERT_EMAIL_TO=joels9568@gmail.com
ALERT_EMAIL_FROM=noreply@nubevigia.com   # debe estar verificado en SendGrid
```

---

## Archivos

### Nuevo: `backend/src/services/emailService.js`

Tres funciones exportadas:

```
sendAlertEmail(level, triggers, prevLevel)
  └─ buildEmailHtml(level, triggers, prevLevel) → string HTML
  └─ _send(to, subject, html)                  → llama @sendgrid/mail
```

- `sendAlertEmail` es el punto de entrada público.
- `_send` está aislada para poder ser mockeada en tests.
- Si SendGrid falla, captura el error, lo loguea con `logger.error` y no relanza — el ciclo de alertas no se interrumpe.

**Contenido del email:**

- **Asunto:** `⚠️ NubeVigía RD — Alerta [AVISO | EMERGENCIA] activa`
- **Cuerpo HTML:**
  - Nivel actual y nivel anterior (`Normal → Aviso`)
  - Hora de detección (ISO, zona horaria `-04:00` RD)
  - Lista de detonadores: provincia, condición, viento km/h
  - Enlace al dashboard: `https://frontend-two-gilt-77.vercel.app`

### Modificado: `backend/src/services/alertService.js`

En `checkAndUpdateAlertStatus()`, antes de actualizar `currentAlertState`:

```js
const prevLevel = currentAlertState.level;
const levelEscalated =
  (level === 'warning' || level === 'emergency') &&
  level !== prevLevel;

if (levelEscalated) {
  await emailService.sendAlertEmail(level, allTriggers, prevLevel);
}
```

No se requieren otros cambios en el archivo.

### Nuevo: `backend/__tests__/emailService.test.js`

| Caso                                      | Resultado esperado              |
|-------------------------------------------|---------------------------------|
| normal → warning                          | `_send` llamado 1 vez           |
| normal → emergency                        | `_send` llamado 1 vez           |
| warning → emergency                       | `_send` llamado 1 vez           |
| emergency → warning (baja)               | `_send` NO llamado              |
| warning → warning (mismo nivel)          | `_send` NO llamado              |
| SendGrid lanza error                     | no relanza, loguea `logger.error`|

---

## Dependencia

```bash
cd backend && npm install @sendgrid/mail
```

---

## Fuera de alcance (v1.5.0)

- Registro de suscriptores desde el frontend
- Persistencia de suscriptores en PostgreSQL
- Email al de-escalar (vuelta a normal)
- Plantilla HTML con diseño visual elaborado
