'use strict';

const request  = require('supertest');
const express  = require('express');

// vi.spyOn() es el approach correcto para módulos CJS: opera en runtime sin hoisting.
// Cargamos los módulos reales y espiaremos sus métodos en cada test.
const alertService   = require('../../src/services/alertService');
const onaMetService  = require('../../src/services/onaMetService');
const reportService  = require('../../src/services/reportService');
const openMeteo      = require('../../src/services/openMeteoService');
const logger         = require('../../src/utils/logger');

const routes             = require('../../src/routes');
const { errorHandler, notFound } = require('../../src/middleware/errorHandler');

// App de prueba aislada (sin app.listen)
const app = express();
app.use(express.json());
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

// Datos de prueba
const mockProvince   = { id: 'santo_domingo', name: 'Distrito Nacional', current: { temp_c: 31.2 } };
const mockAlertState = { level: 'normal', isEmergency: false, triggers: [], onaMetAlerts: [] };
const mockReport     = { id: 'daily-1', type: 'daily', generatedAt: new Date().toISOString(), summary: '...' };

beforeEach(() => {
  vi.spyOn(logger, 'info').mockImplementation(() => {});
  vi.spyOn(logger, 'warn').mockImplementation(() => {});
  vi.spyOn(logger, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

// ─── GET /api/health ──────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  test('retorna 200 con status OK', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
    expect(res.body.timestamp).toBeDefined();
  });
});

// ─── GET /api/weather ─────────────────────────────────────────────────────────

describe('GET /api/weather', () => {
  test('retorna 200 con lista de provincias', async () => {
    vi.spyOn(alertService, 'getCachedWeatherData')
      .mockResolvedValue({ data: [mockProvince], isStale: false, staleFrom: null });

    const res = await request(app).get('/api/weather');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  test('retorna 500 cuando el servicio lanza excepción', async () => {
    vi.spyOn(alertService, 'getCachedWeatherData')
      .mockRejectedValue(new Error('Service error'));

    const res = await request(app).get('/api/weather');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/weather/:provinceId', () => {
  test('retorna 200 con datos de la provincia', async () => {
    vi.spyOn(openMeteo, 'getSingleProvinceWeather').mockResolvedValue(mockProvince);

    const res = await request(app).get('/api/weather/santo_domingo');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('santo_domingo');
  });

  test('retorna 404 para provincia inexistente', async () => {
    const err = new Error('Provincia no encontrada'); err.status = 404;
    vi.spyOn(openMeteo, 'getSingleProvinceWeather').mockRejectedValue(err);

    const res = await request(app).get('/api/weather/provincia_falsa');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── GET /api/alerts/status ───────────────────────────────────────────────────

describe('GET /api/alerts/status', () => {
  test('retorna 200 con el estado de alertas', async () => {
    vi.spyOn(alertService, 'getAlertState').mockReturnValue(mockAlertState);
    vi.spyOn(onaMetService, 'getAlerts').mockReturnValue({ alerts: [], lastUpdated: null });

    const res = await request(app).get('/api/alerts/status');

    expect(res.status).toBe(200);
    expect(res.body.data.level).toBe('normal');
    expect(res.body.data.isEmergency).toBe(false);
  });
});

// ─── POST /api/alerts/onamet ──────────────────────────────────────────────────

describe('POST /api/alerts/onamet', () => {
  test('retorna 400 cuando falta el campo title', async () => {
    const res = await request(app)
      .post('/api/alerts/onamet')
      .send({ description: 'Solo descripción, falta título' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('retorna 400 cuando falta el campo description', async () => {
    const res = await request(app)
      .post('/api/alerts/onamet')
      .send({ title: 'Solo título, falta descripción' });

    expect(res.status).toBe(400);
  });

  test('retorna 200 y llama a setManualAlert con datos válidos', async () => {
    vi.spyOn(alertService, 'checkAndUpdateAlertStatus').mockResolvedValue(mockAlertState);
    const setManualSpy = vi.spyOn(onaMetService, 'setManualAlert').mockImplementation(() => {});

    const res = await request(app)
      .post('/api/alerts/onamet')
      .send({ title: 'Alerta prueba', description: 'Descripción de prueba', severity: 'warning' });

    expect(res.status).toBe(200);
    expect(setManualSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Alerta prueba', severity: 'warning' })
    );
  });
});

// ─── DELETE /api/alerts/onamet ────────────────────────────────────────────────

describe('DELETE /api/alerts/onamet', () => {
  test('retorna 200 y limpia las alertas ONAMET', async () => {
    vi.spyOn(alertService, 'checkAndUpdateAlertStatus').mockResolvedValue(mockAlertState);
    const clearSpy = vi.spyOn(onaMetService, 'clearAlerts').mockImplementation(() => {});

    const res = await request(app).delete('/api/alerts/onamet');

    expect(res.status).toBe(200);
    expect(clearSpy).toHaveBeenCalled();
  });
});

// ─── GET /api/reports/latest ──────────────────────────────────────────────────

describe('GET /api/reports/latest', () => {
  test('retorna 200 cuando hay un reporte', async () => {
    vi.spyOn(reportService, 'getLatestReport').mockReturnValue(mockReport);

    const res = await request(app).get('/api/reports/latest');

    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe('daily');
  });

  test('retorna 404 cuando no hay reportes', async () => {
    vi.spyOn(reportService, 'getLatestReport').mockReturnValue(null);

    const res = await request(app).get('/api/reports/latest');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ─── POST /api/reports/generate ───────────────────────────────────────────────

describe('POST /api/reports/generate', () => {
  test('genera reporte diario por defecto', async () => {
    const genSpy = vi.spyOn(reportService, 'generateDailyReport').mockResolvedValue(mockReport);

    const res = await request(app).post('/api/reports/generate');

    expect(res.status).toBe(200);
    expect(genSpy).toHaveBeenCalled();
  });

  test('genera reporte de emergencia con ?type=emergency', async () => {
    const emergencyReport = { ...mockReport, type: 'emergency' };
    const genSpy = vi.spyOn(reportService, 'generateEmergencyReport').mockResolvedValue(emergencyReport);

    const res = await request(app).post('/api/reports/generate?type=emergency');

    expect(res.status).toBe(200);
    expect(genSpy).toHaveBeenCalled();
    expect(res.body.data.type).toBe('emergency');
  });
});

// ─── Rutas inexistentes ───────────────────────────────────────────────────────

describe('Rutas no encontradas', () => {
  test('retorna 404 para ruta desconocida', async () => {
    const res = await request(app).get('/api/ruta-que-no-existe');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
