# 🔖 Continuar mañana — Seguridad de `POST /api/alerts/refresh`

> Estado al 2026-07-22. Todo el trabajo está en el working tree **sin commitear**.

## ✅ Hecho (Procesos 1–4 de `mandatos/`)
- **P1 Auditoría** — endpoint era público; guard es seguro (cron llama al service directo, frontend no usa la ruta, ningún test la golpeaba).
- **P2 Auth JWT** — implementada. Mecanismo elegido por el usuario: **JWT (Bearer token)**.
- **P3 Tests** — 6 tests de integración nuevos. **Suite completa: 211/211 en verde** (Vitest, no Jest).
- **P4 Revocación** — solo diseño: recomienda `token_version` por usuario en PostgreSQL.

## 📂 Archivos del cambio
| Nuevo | `backend/src/middleware/authGuard.js`, `backend/scripts/generate-token.js`, `backend/__tests__/routes/alertsRefresh.auth.test.js` |
| Modificado | `backend/src/routes/alerts.js` (guard en `/refresh`), `.env.example`, `CLAUDE.md`, `package.json` (+`jsonwebtoken`) |

## ▶️ Cómo verificar (PowerShell)
```powershell
cd backend
npm test                                   # espera: Tests 211 passed
# Demo en vivo:
npm run dev                                # arranca :3001
# en otra terminal:
$TOKEN = node scripts/generate-token.js 1h
curl.exe -i -X POST http://localhost:3001/api/alerts/refresh                               # 401
curl.exe -i -X POST http://localhost:3001/api/alerts/refresh -H "Authorization: Bearer $TOKEN"  # 200
```

## ⏭️ Pendiente
1. **Commit** (en master → conviene branch primero). Sugerido: `feat: proteger POST /api/alerts/refresh con JWT — v1.5.1`.
2. **`JWT_SECRET` de producción** en Railway (no en el repo): `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
3. Opcional: implementar el diseño del **Proceso 4** (revocación de tokens).
4. Rutas aún sin auth: `POST/DELETE /api/alerts/onamet`, `POST /api/reports/generate`.

## 🖥️ Artefactos de revisión
`presentacion-mandatos.html` (plan) · `resultado-mandatos.html` (resultados + verificación).
