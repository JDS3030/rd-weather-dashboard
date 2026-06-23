'use strict';

jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(), warn: jest.fn(), error: jest.fn(),
}));

const onaMetService = require('../../src/services/onaMetService');

afterEach(() => {
  // Limpiar estado entre tests
  onaMetService.clearAlerts();
  delete process.env.ONAMET_SIMULATE_EMERGENCY;
  delete process.env.ONAMET_SIMULATE_WATCH;
});

describe('fetchLatestBulletin()', () => {
  test('retorna [] cuando no hay simulación activa', async () => {
    const alerts = await onaMetService.fetchLatestBulletin();
    expect(alerts).toEqual([]);
  });

  test('retorna alerta de emergencia cuando ONAMET_SIMULATE_EMERGENCY=true', async () => {
    process.env.ONAMET_SIMULATE_EMERGENCY = 'true';
    const alerts = await onaMetService.fetchLatestBulletin();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('emergency');
    expect(alerts[0].type).toBe('tropical_storm');
  });

  test('alerta simulada incluye los campos requeridos', async () => {
    process.env.ONAMET_SIMULATE_EMERGENCY = 'true';
    const alerts = await onaMetService.fetchLatestBulletin();
    const alert  = alerts[0];
    expect(alert).toHaveProperty('id');
    expect(alert).toHaveProperty('title');
    expect(alert).toHaveProperty('description');
    expect(alert).toHaveProperty('affectedRegions');
    expect(alert).toHaveProperty('source', 'ONAMET');
  });

  test('retorna alerta de vigilancia cuando ONAMET_SIMULATE_WATCH=true', async () => {
    process.env.ONAMET_SIMULATE_WATCH = 'true';
    const alerts = await onaMetService.fetchLatestBulletin();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].severity).toBe('watch');
  });

  test('EMERGENCY tiene prioridad sobre WATCH si ambas están activas', async () => {
    process.env.ONAMET_SIMULATE_EMERGENCY = 'true';
    process.env.ONAMET_SIMULATE_WATCH     = 'true';
    const alerts = await onaMetService.fetchLatestBulletin();
    expect(alerts[0].severity).toBe('emergency');
  });
});

describe('setManualAlert() y getAlerts()', () => {
  const manualAlert = {
    id: 'manual-001', title: 'Alerta manual de prueba',
    description: 'Test', type: 'manual', severity: 'warning',
    affectedRegions: ['Sur'], issuedAt: new Date().toISOString(), source: 'ONAMET-Manual',
  };

  test('setManualAlert() guarda la alerta y getAlerts() la retorna', () => {
    onaMetService.setManualAlert(manualAlert);
    const { alerts } = onaMetService.getAlerts();
    expect(alerts).toHaveLength(1);
    expect(alerts[0].title).toBe('Alerta manual de prueba');
  });

  test('clearAlerts() elimina todas las alertas', () => {
    onaMetService.setManualAlert(manualAlert);
    onaMetService.clearAlerts();
    const { alerts } = onaMetService.getAlerts();
    expect(alerts).toHaveLength(0);
  });

  test('getAlerts() retorna el campo source correcto', () => {
    const { source } = onaMetService.getAlerts();
    expect(source).toContain('ONAMET');
  });
});
