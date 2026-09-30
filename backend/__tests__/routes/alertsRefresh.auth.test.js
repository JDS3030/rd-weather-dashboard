'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Pruebas de integración (Proceso 3) — Autenticación JWT de POST /api/alerts/refresh
//
// IMPORTANTE sobre el orden de carga y JWT_SECRET:
//   El middleware `authGuard` lee `process.env.JWT_SECRET` EN TIEMPO DE PETICIÓN
//   (dentro de la función, no al importar el módulo). Aun así, definimos el
//   secreto ANTES de cualquier `require` de la app para:
//     1) evitar el modo fail-closed (sin JWT_SECRET → 500),
//     2) garantizar que firmamos los tokens de prueba con el MISMO secreto que
//        el guard usará al verificar.
//   Los tests NO cargan dotenv (vitest.setup.mjs sólo aliasa `jest`→`vi`), por lo
//   que un `backend/.env` real no puede pisar este valor de prueba.
// ─────────────────────────────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test-secret';

const request = require('supertest');
const express = require('express');
const jwt     = require('jsonwebtoken');

// vi.spyOn() sobre módulos CJS reales, igual que en api.test.js.
const alertService = require('../../src/services/alertService');
const logger       = require('../../src/utils/logger');

const routes = require('../../src/routes');
const { errorHandler, notFound } = require('../../src/middleware/errorHandler');

// App de prueba aislada (sin app.listen), idéntica al patrón de api.test.js.
const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

// Datos de prueba
const mockAlertState = { level: 'normal', isEmergency: false, triggers: [], onaMetAlerts: [] };

// Helper: firma un token con el MISMO secreto de prueba que usa el guard.
const signToken = (opts = {}) =>
  jwt.sign({ sub: 'service', role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h', ...opts });

beforeEach(() => {
  vi.spyOn(logger, 'info').mockImplementation(() => {});
  vi.spyOn(logger, 'warn').mockImplementation(() => {});
  vi.spyOn(logger, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

// ─── POST /api/alerts/refresh (protegido con JWT) ──────────────────────────────

describe('POST /api/alerts/refresh — autenticación JWT', () => {
  // (a) Sin header Authorization → 401
  test('retorna 401 cuando falta el header Authorization', async () => {
    const refreshSpy = vi.spyOn(alertService, 'checkAndUpdateAlertStatus').mockResolvedValue(mockAlertState);

    const res = await request(app).post('/api/alerts/refresh');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    // El guard rechaza antes de tocar el servicio.
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  // (b) Token inválido (firma incorrecta / basura) → 401
  test('retorna 401 con un token de firma incorrecta', async () => {
    const refreshSpy = vi.spyOn(alertService, 'checkAndUpdateAlertStatus').mockResolvedValue(mockAlertState);
    const badToken = jwt.sign({ sub: 'service', role: 'admin' }, 'secreto-equivocado', { expiresIn: '1h' });

    const res = await request(app)
      .post('/api/alerts/refresh')
      .set('Authorization', `Bearer ${badToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  test('retorna 401 con un token basura (no es un JWT)', async () => {
    const refreshSpy = vi.spyOn(alertService, 'checkAndUpdateAlertStatus').mockResolvedValue(mockAlertState);

    const res = await request(app)
      .post('/api/alerts/refresh')
      .set('Authorization', 'Bearer esto-no-es-un-jwt');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(refreshSpy).not.toHaveBeenCalled();
  });

  // (c) Token válido (bien firmado, no expirado) → 200 y body.success === true
  test('retorna 200 y success=true con un token válido', async () => {
    const refreshSpy = vi.spyOn(alertService, 'checkAndUpdateAlertStatus').mockResolvedValue(mockAlertState);
    const token = signToken();

    const res = await request(app)
      .post('/api/alerts/refresh')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.level).toBe('normal');
    // El controlador sí ejecuta el servicio (mockeado, sin llamar a APIs reales).
    expect(refreshSpy).toHaveBeenCalled();
  });

  // (Extra) Token expirado → 401
  test('retorna 401 con un token expirado', async () => {
    const refreshSpy = vi.spyOn(alertService, 'checkAndUpdateAlertStatus').mockResolvedValue(mockAlertState);
    const expiredToken = signToken({ expiresIn: '-1s' });

    const res = await request(app)
      .post('/api/alerts/refresh')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(refreshSpy).not.toHaveBeenCalled();
  });
});

// ─── Regresión: rutas públicas siguen accesibles sin token ─────────────────────

describe('Regresión — rutas públicas no requieren token', () => {
  // (d) GET /api/weather sin token → 200
  test('GET /api/weather retorna 200 sin header Authorization', async () => {
    vi.spyOn(alertService, 'getCachedWeatherData')
      .mockResolvedValue({ data: [{ id: 'santo_domingo', name: 'Distrito Nacional' }], isStale: false, staleFrom: null });

    const res = await request(app).get('/api/weather');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
