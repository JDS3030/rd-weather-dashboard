'use strict';

const { PROVINCES_NORMAL, ONAMET_EMERGENCY_ALERT } = require('../fixtures/weatherData');

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

// ─── buildWeatherSummary (accedida de forma indirecta) ────────────────────────

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

  test('incluye generatedAt como ISO string', async () => {
    const report = await reportService.generateDailyReport();
    expect(() => new Date(report.generatedAt)).not.toThrow();
  });

  test('summary contiene temperatura promedio', async () => {
    const report = await reportService.generateDailyReport();
    expect(report.summary).toContain('Temperatura promedio');
  });

  test('summary lista las provincias con lluvia', async () => {
    // La Vega tiene precip_mm > 0 en PROVINCES_NORMAL
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
    const reports = reportService.getReports();
    expect(reports.length).toBeGreaterThanOrEqual(1);
  });

  test('el reporte más reciente aparece primero (LIFO)', async () => {
    await reportService.generateDailyReport();
    await reportService.generateDailyReport();
    const reports = reportService.getReports();
    expect(new Date(reports[0].generatedAt).getTime())
      .toBeGreaterThanOrEqual(new Date(reports[1].generatedAt).getTime());
  });
});

describe('generateEmergencyReport()', () => {
  beforeEach(() => {
    alertService.getCachedWeatherData.mockResolvedValue({ data: PROVINCES_NORMAL, isStale: false, staleFrom: null });
    alertService.getAlertState.mockReturnValue({
      level: 'emergency',
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

  test('summary contiene los triggers activos', async () => {
    const report = await reportService.generateEmergencyReport();
    expect(report.summary).toContain('ONAMET');
  });

  test('incluye las alertas de ONAMET en el reporte', async () => {
    const report = await reportService.generateEmergencyReport();
    expect(report.onaMetAlerts).toHaveLength(1);
    expect(report.onaMetAlerts[0].title).toBe(ONAMET_EMERGENCY_ALERT.title);
  });
});

describe('getLatestReport() — sin reportes', () => {
  test('retorna null si no hay reportes generados', () => {
    expect(reportService.getLatestReport()).toBeNull();
  });
});

describe('getReports()', () => {
  test('respeta el límite máximo del parámetro', async () => {
    alertService.getCachedWeatherData.mockResolvedValue(PROVINCES_NORMAL);
    alertService.getAlertState.mockReturnValue({ level: 'normal', triggers: [] });
    onaMetService.getAlerts.mockReturnValue({ alerts: [] });

    alertService.getCachedWeatherData.mockResolvedValue({ data: PROVINCES_NORMAL, isStale: false, staleFrom: null });
    for (let i = 0; i < 5; i++) await reportService.generateDailyReport();

    const reports = reportService.getReports(3);
    expect(reports).toHaveLength(3);
  });
});
