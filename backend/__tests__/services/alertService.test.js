'use strict';

const {
  PROVINCES_NORMAL,
  PROVINCE_HURRICANE_WIND,
  PROVINCE_TROPICAL_STORM_WIND,
  PROVINCE_HURRICANE_CONDITION,
  PROVINCE_WEATHERAPI_ALERT,
  PROVINCE_TROPICAL_STORM_TEXT,
  ONAMET_EMERGENCY_ALERT,
  ONAMET_WARNING_ALERT,
  ONAMET_WATCH_ALERT,
} = require('../fixtures/weatherData');

// Re-require módulos frescos en cada test para aislar el estado interno del servicio
let alertService, weatherApiService, onaMetService;

beforeEach(() => {
  jest.resetModules();
  jest.mock('../../src/services/openMeteoService');
  jest.mock('../../src/services/onaMetService');
  jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(), warn: jest.fn(), error: jest.fn(),
  }));
  alertService       = require('../../src/services/alertService');
  weatherApiService  = require('../../src/services/openMeteoService');
  onaMetService      = require('../../src/services/onaMetService');
});

// ─── Estado inicial ────────────────────────────────────────────────────────────

describe('estado inicial', () => {
  test('getAlertState() retorna level "normal" al iniciar', () => {
    const state = alertService.getAlertState();
    expect(state.level).toBe('normal');
    expect(state.isEmergency).toBe(false);
    expect(state.triggers).toEqual([]);
  });

  test('isEmergencyActive() retorna false al iniciar', () => {
    expect(alertService.isEmergencyActive()).toBe(false);
  });
});

// ─── checkAndUpdateAlertStatus ─────────────────────────────────────────────────

describe('checkAndUpdateAlertStatus()', () => {
  test('retorna level "normal" cuando no hay triggers', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.level).toBe('normal');
    expect(state.isEmergency).toBe(false);
    expect(state.triggers).toHaveLength(0);
  });

  test('activa "emergency" cuando wind_kph >= 119 (HURRICANE_CAT1)', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_HURRICANE_WIND], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.level).toBe('emergency');
    expect(state.isEmergency).toBe(true);
    expect(state.triggers[0].source).toBe('WeatherAPI-Wind');
    expect(state.triggers[0].province).toBe('Monte Cristi');
    expect(state.triggers[0].level).toMatch(/Huracán/);
  });

  test('activa "watch" cuando wind_kph >= 63 (TROPICAL_STORM) pero < 119', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_TROPICAL_STORM_WIND], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.level).toBe('watch');
    const windTrigger = state.triggers.find(t => t.source === 'WeatherAPI-Wind');
    expect(windTrigger.level).toMatch(/Tormenta/);
  });

  test('detecta keyword "hurricane" en condition.text → nivel watch', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_HURRICANE_CONDITION], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    // Keyword en condition.text crea trigger de vigilancia (watch), no emergencia.
    // Solo viento ≥119 km/h u ONAMET severity=emergency activan isEmergency.
    expect(state.level).toBe('watch');
    const condTrigger = state.triggers.find(t => t.source === 'WeatherAPI-Condition');
    expect(condTrigger).toBeDefined();
    expect(condTrigger.province).toBe('Nagua');
  });

  test('detecta keyword "tormenta tropical" en condition.text (case-insensitive) → watch', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_TROPICAL_STORM_TEXT], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.level).toBe('watch');
    expect(state.triggers.some(t => t.keyword?.includes('tormenta tropical'))).toBe(true);
  });

  test('detecta alert de WeatherAPI con keyword en event text → watch', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_WEATHERAPI_ALERT], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    // Un WeatherAPI alert crea trigger watch, no emergencia (sin severity/level de huracán)
    expect(state.level).toBe('watch');
    expect(state.triggers.some(t => t.source === 'WeatherAPI-Alert')).toBe(true);
  });

  test('activa "emergency" con alerta ONAMET severity="emergency"', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([ONAMET_EMERGENCY_ALERT]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.isEmergency).toBe(true);
    expect(state.triggers.some(t => t.source === 'ONAMET')).toBe(true);
  });

  test('activa "warning" con alerta ONAMET severity="warning"', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([ONAMET_WARNING_ALERT]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.level).toBe('warning');
    expect(state.isEmergency).toBe(false);
  });

  test('ignora alerta ONAMET con severity="watch" para "emergency"', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([ONAMET_WATCH_ALERT]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.isEmergency).toBe(false);
  });

  test('graba activatedAt la primera vez que se activa la emergencia', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_HURRICANE_WIND], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.activatedAt).not.toBeNull();
    expect(new Date(state.activatedAt).getTime()).toBeLessThanOrEqual(Date.now());
  });

  test('preserva activatedAt si ya estaba en emergencia (no lo pisa)', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_HURRICANE_WIND], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const first  = await alertService.checkAndUpdateAlertStatus();
    const second = await alertService.checkAndUpdateAlertStatus();

    expect(second.activatedAt).toBe(first.activatedAt);
  });

  test('resetea activatedAt cuando la emergencia se normaliza', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_HURRICANE_WIND], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);
    await alertService.checkAndUpdateAlertStatus(); // activa emergencia

    weatherApiService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);
    const normal = await alertService.checkAndUpdateAlertStatus();

    expect(normal.activatedAt).toBeNull();
  });

  test('actualiza lastChecked en cada llamada', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const before = Date.now();
    const state  = await alertService.checkAndUpdateAlertStatus();
    const after  = Date.now();
    const ts     = new Date(state.lastChecked).getTime();

    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

// ─── Cache ─────────────────────────────────────────────────────────────────────

describe('getCachedWeatherData()', () => {
  test('llama a getAllProvincesWeather en el primer request', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });

    await alertService.getCachedWeatherData();

    expect(weatherApiService.getAllProvincesWeather).toHaveBeenCalledTimes(1);
  });

  test('usa el cache en el segundo request (no vuelve a llamar la API)', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });

    await alertService.getCachedWeatherData();
    await alertService.getCachedWeatherData();

    expect(weatherApiService.getAllProvincesWeather).toHaveBeenCalledTimes(1);
  });

  test('retorna los datos de las provincias correctamente', async () => {
    weatherApiService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });

    const { data } = await alertService.getCachedWeatherData();

    expect(data).toHaveLength(PROVINCES_NORMAL.length);
    expect(data[0].name).toBe('Distrito Nacional');
  });
});
