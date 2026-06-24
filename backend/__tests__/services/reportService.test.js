'use strict';

const { PROVINCES_NORMAL, ONAMET_EMERGENCY_ALERT, makeProvince } = require('../fixtures/weatherData');

let reportService, alertService, onaMetService;

beforeEach(() => {
  jest.resetModules();
  jest.mock('../../src/services/alertService');
  jest.mock('../../src/services/onaMetService');
  jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(),
  }));
  reportService = require('../../src/services/reportService');
  alertService  = require('../../src/services/alertService');
  onaMetService = require('../../src/services/onaMetService');
});

// ─── buildWeatherSummary ──────────────────────────────────────────────────────

describe('buildWeatherSummary()', () => {
  test('retorna texto de fallback cuando provincesData es null', () => {
    const { buildWeatherSummary } = require('../../src/services/reportService');
    expect(buildWeatherSummary(null)).toBe('Sin datos disponibles.');
  });

  test('retorna texto de fallback cuando provincesData es array vacío', () => {
    const { buildWeatherSummary } = require('../../src/services/reportService');
    expect(buildWeatherSummary([])).toBe('Sin datos disponibles.');
  });

  test('incluye el rótulo "Temperatura promedio" con datos normales', () => {
    const { buildWeatherSummary } = require('../../src/services/reportService');
    const result = buildWeatherSummary(PROVINCES_NORMAL);
    expect(result).toContain('Temperatura promedio');
  });

  test('incluye el campo "Viento máximo"', () => {
    const { buildWeatherSummary } = require('../../src/services/reportService');
    const result = buildWeatherSummary(PROVINCES_NORMAL);
    expect(result).toContain('Viento máximo');
  });

  test('lista la provincia con lluvia (La Vega tiene precip_mm > 0)', () => {
    const { buildWeatherSummary } = require('../../src/services/reportService');
    const result = buildWeatherSummary(PROVINCES_NORMAL);
    expect(result).toContain('La Vega');
  });

  test('muestra "Ninguna" cuando no hay provincias con lluvia', () => {
    const { buildWeatherSummary } = require('../../src/services/reportService');
    const dryProvinces = [
      makeProvince({ id: 'a', name: 'Provincia A', current: { ...makeProvince().current, precip_mm: 0 } }),
    ];
    expect(buildWeatherSummary(dryProvinces)).toContain('Ninguna');
  });

  test('calcula correctamente el promedio de temperatura', () => {
    const { buildWeatherSummary } = require('../../src/services/reportService');
    const provinces = [
      makeProvince({ current: { ...makeProvince().current, temp_c: 30 } }),
      makeProvince({ current: { ...makeProvince().current, temp_c: 20 } }),
    ];
    const result = buildWeatherSummary(provinces);
    expect(result).toContain('25.0°C');
  });

  test('incluye el conteo de provincias monitoreadas', () => {
    const { buildWeatherSummary } = require('../../src/services/reportService');
    const result = buildWeatherSummary(PROVINCES_NORMAL);
    expect(result).toContain(`Provincias monitoreadas: ${PROVINCES_NORMAL.length}`);
  });

  test('no lanza error cuando current.temp_c no es número (NaN filtering)', () => {
    const { buildWeatherSummary } = require('../../src/services/reportService');
    const province = makeProvince({ current: { ...makeProvince().current, temp_c: null } });
    expect(() => buildWeatherSummary([province])).not.toThrow();
  });
});

// ─── generateDailyReport ─────────────────────────────────────────────────────

describe('generateDailyReport()', () => {
  beforeEach(() => {
    alertService.getCachedWeatherData.mockResolvedValue({ data: PROVINCES_NORMAL, isStale: false, staleFrom: null });
    alertService.getAlertState.mockReturnValue({ level: 'normal', triggers: [] });
    onaMetService.getAlerts.mockReturnValue({ alerts: [], lastUpdated: null });
  });

  test('retorna objeto con type "daily"', async () => {
    const report = await reportService.generateDailyReport();
    expect(report.type).toBe('daily');
  });

  test('retorna id con prefijo "daily-"', async () => {
    const report = await reportService.generateDailyReport();
    expect(report.id).toMatch(/^daily-\d+$/);
  });

  test('incluye generatedAt como ISO string válido', async () => {
    const report = await reportService.generateDailyReport();
    expect(new Date(report.generatedAt).getTime()).not.toBeNaN();
  });

  test('summary contiene temperatura promedio', async () => {
    const report = await reportService.generateDailyReport();
    expect(report.summary).toContain('Temperatura promedio');
  });

  test('summary lista la provincia con lluvia (La Vega)', async () => {
    const report = await reportService.generateDailyReport();
    expect(report.summary).toContain('La Vega');
  });

  test('guarda el reporte y getLatestReport() lo retorna', async () => {
    await reportService.generateDailyReport();
    const latest = reportService.getLatestReport();
    expect(latest).not.toBeNull();
    expect(latest.type).toBe('daily');
  });

  test('getReports() retorna array con el reporte generado', async () => {
    await reportService.generateDailyReport();
    expect(reportService.getReports().length).toBeGreaterThanOrEqual(1);
  });

  test('el reporte más reciente aparece primero (LIFO)', async () => {
    await reportService.generateDailyReport();
    await reportService.generateDailyReport();
    const [first, second] = reportService.getReports();
    expect(new Date(first.generatedAt).getTime())
      .toBeGreaterThanOrEqual(new Date(second.generatedAt).getTime());
  });
});

// ─── generateEmergencyReport ──────────────────────────────────────────────────

describe('generateEmergencyReport()', () => {
  beforeEach(() => {
    alertService.getCachedWeatherData.mockResolvedValue({ data: PROVINCES_NORMAL, isStale: false, staleFrom: null });
    alertService.getAlertState.mockReturnValue({
      level:    'emergency',
      triggers: [{ source: 'ONAMET', title: 'AVISO ESPECIAL', severity: 'emergency' }],
    });
    onaMetService.getAlerts.mockReturnValue({
      alerts: [ONAMET_EMERGENCY_ALERT], lastUpdated: '2026-06-22T12:00:00Z',
    });
  });

  test('retorna objeto con type "emergency"', async () => {
    const report = await reportService.generateEmergencyReport();
    expect(report.type).toBe('emergency');
  });

  test('summary contiene "EMERGENCIA"', async () => {
    const report = await reportService.generateEmergencyReport();
    expect(report.summary.toUpperCase()).toContain('EMERGENCIA');
  });

  test('summary contiene el trigger ONAMET', async () => {
    const report = await reportService.generateEmergencyReport();
    expect(report.summary).toContain('ONAMET');
  });

  test('incluye las alertas de ONAMET en el reporte', async () => {
    const report = await reportService.generateEmergencyReport();
    expect(report.onaMetAlerts).toHaveLength(1);
    expect(report.onaMetAlerts[0].title).toBe(ONAMET_EMERGENCY_ALERT.title);
  });

  test('id tiene prefijo "emergency-"', async () => {
    const report = await reportService.generateEmergencyReport();
    expect(report.id).toMatch(/^emergency-\d+$/);
  });
});

// ─── getLatestReport ─────────────────────────────────────────────────────────

describe('getLatestReport() — sin reportes', () => {
  test('retorna null si no hay reportes generados', () => {
    expect(reportService.getLatestReport()).toBeNull();
  });
});

// ─── getReports ───────────────────────────────────────────────────────────────

describe('getReports()', () => {
  test('respeta el límite máximo del parámetro', async () => {
    alertService.getCachedWeatherData.mockResolvedValue({ data: PROVINCES_NORMAL, isStale: false, staleFrom: null });
    alertService.getAlertState.mockReturnValue({ level: 'normal', triggers: [] });
    onaMetService.getAlerts.mockReturnValue({ alerts: [] });

    for (let i = 0; i < 5; i++) await reportService.generateDailyReport();

    expect(reportService.getReports(3)).toHaveLength(3);
  });

  test('sin parámetro, devuelve hasta 10 reportes por defecto', async () => {
    alertService.getCachedWeatherData.mockResolvedValue({ data: PROVINCES_NORMAL, isStale: false, staleFrom: null });
    alertService.getAlertState.mockReturnValue({ level: 'normal', triggers: [] });
    onaMetService.getAlerts.mockReturnValue({ alerts: [] });

    for (let i = 0; i < 12; i++) await reportService.generateDailyReport();

    expect(reportService.getReports()).toHaveLength(10);
  });
});
