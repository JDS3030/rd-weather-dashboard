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

// vi.spyOn() es el approach correcto para módulos CJS: opera en runtime sin hoisting.
// alertService importa weatherProviderService (no openMeteoService directamente).
const alertService           = require('../../src/services/alertService');
const weatherProviderService = require('../../src/services/weatherProviderService');
const onaMetService          = require('../../src/services/onaMetService');
const alertHistoryRepository = require('../../src/repositories/alertHistoryRepository');
const logger                 = require('../../src/utils/logger');

beforeEach(() => {
  alertService.resetState();
  vi.spyOn(weatherProviderService, 'getAllProvincesWeather');
  vi.spyOn(onaMetService, 'fetchLatestBulletin');
  vi.spyOn(alertHistoryRepository, 'insert').mockResolvedValue(undefined);
  vi.spyOn(logger, 'info').mockImplementation(() => {});
  vi.spyOn(logger, 'warn').mockImplementation(() => {});
  vi.spyOn(logger, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

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
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.level).toBe('normal');
    expect(state.isEmergency).toBe(false);
    expect(state.triggers).toHaveLength(0);
  });

  test('activa "emergency" cuando wind_kph >= 119 (HURRICANE_CAT1)', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({
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
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_TROPICAL_STORM_WIND], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.level).toBe('watch');
    const windTrigger = state.triggers.find(t => t.source === 'WeatherAPI-Wind');
    expect(windTrigger.level).toMatch(/Tormenta/);
  });

  test('detecta keyword "hurricane" en condition.text → nivel watch', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_HURRICANE_CONDITION], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.level).toBe('watch');
    const condTrigger = state.triggers.find(t => t.source === 'WeatherAPI-Condition');
    expect(condTrigger).toBeDefined();
    expect(condTrigger.province).toBe('Nagua');
  });

  test('detecta keyword "tormenta tropical" en condition.text (case-insensitive) → watch', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_TROPICAL_STORM_TEXT], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.level).toBe('watch');
    expect(state.triggers.some(t => t.keyword?.includes('tormenta tropical'))).toBe(true);
  });

  test('detecta alert de WeatherAPI con keyword en event text → watch', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_WEATHERAPI_ALERT], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.level).toBe('watch');
    expect(state.triggers.some(t => t.source === 'WeatherAPI-Alert')).toBe(true);
  });

  test('activa "emergency" con alerta ONAMET severity="emergency"', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([ONAMET_EMERGENCY_ALERT]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.isEmergency).toBe(true);
    expect(state.triggers.some(t => t.source === 'ONAMET')).toBe(true);
  });

  test('activa "warning" con alerta ONAMET severity="warning"', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([ONAMET_WARNING_ALERT]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.level).toBe('warning');
    expect(state.isEmergency).toBe(false);
  });

  test('ignora alerta ONAMET con severity="watch" para "emergency"', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([ONAMET_WATCH_ALERT]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.isEmergency).toBe(false);
  });

  test('graba activatedAt la primera vez que se activa la emergencia', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_HURRICANE_WIND], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.activatedAt).not.toBeNull();
    expect(new Date(state.activatedAt).getTime()).toBeLessThanOrEqual(Date.now());
  });

  test('preserva activatedAt si ya estaba en emergencia (no lo pisa)', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_HURRICANE_WIND], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const first  = await alertService.checkAndUpdateAlertStatus();
    const second = await alertService.checkAndUpdateAlertStatus();

    expect(second.activatedAt).toBe(first.activatedAt);
  });

  test('resetea activatedAt cuando la emergencia se normaliza', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_HURRICANE_WIND], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);
    await alertService.checkAndUpdateAlertStatus();

    weatherProviderService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);
    const normal = await alertService.checkAndUpdateAlertStatus();

    expect(normal.activatedAt).toBeNull();
  });

  test('actualiza lastChecked en cada llamada', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const before = Date.now();
    const state  = await alertService.checkAndUpdateAlertStatus();
    const after  = Date.now();
    const ts     = new Date(state.lastChecked).getTime();

    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
});

// ─── Persistencia del historial ─────────────────────────────────────────────

describe('persistencia del historial de alertas', () => {
  test('registra el cambio de nivel al escalar normal → emergency', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_HURRICANE_WIND], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    await alertService.checkAndUpdateAlertStatus();

    expect(alertHistoryRepository.insert).toHaveBeenCalledTimes(1);
    const entry = alertHistoryRepository.insert.mock.calls[0][0];
    expect(entry.fromLevel).toBe('normal');
    expect(entry.toLevel).toBe('emergency');
    expect(entry.province).toBe('Monte Cristi');
    expect(entry.triggerCount).toBeGreaterThan(0);
    expect(Array.isArray(entry.triggers)).toBe(true);
  });

  test('NO registra cuando el nivel no cambia (normal → normal)', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    await alertService.checkAndUpdateAlertStatus();

    expect(alertHistoryRepository.insert).not.toHaveBeenCalled();
  });

  test('registra también cuando el nivel baja (emergency → normal)', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_HURRICANE_WIND], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);
    await alertService.checkAndUpdateAlertStatus(); // normal → emergency

    weatherProviderService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);
    await alertService.checkAndUpdateAlertStatus(); // emergency → normal

    expect(alertHistoryRepository.insert).toHaveBeenCalledTimes(2);
    const second = alertHistoryRepository.insert.mock.calls[1][0];
    expect(second.fromLevel).toBe('emergency');
    expect(second.toLevel).toBe('normal');
  });

  test('un fallo del repositorio no interrumpe el ciclo de alertas', async () => {
    alertHistoryRepository.insert.mockRejectedValueOnce(new Error('DB caída'));
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({
      data: [PROVINCE_HURRICANE_WIND], errors: [],
    });
    onaMetService.fetchLatestBulletin.mockResolvedValue([]);

    const state = await alertService.checkAndUpdateAlertStatus();

    expect(state.level).toBe('emergency');
  });
});

// ─── Cache ─────────────────────────────────────────────────────────────────────

describe('getCachedWeatherData()', () => {
  test('llama a getAllProvincesWeather en el primer request', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });

    await alertService.getCachedWeatherData();

    expect(weatherProviderService.getAllProvincesWeather).toHaveBeenCalledTimes(1);
  });

  test('usa el cache en el segundo request (no vuelve a llamar la API)', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });

    await alertService.getCachedWeatherData();
    await alertService.getCachedWeatherData();

    expect(weatherProviderService.getAllProvincesWeather).toHaveBeenCalledTimes(1);
  });

  test('retorna los datos de las provincias correctamente', async () => {
    weatherProviderService.getAllProvincesWeather.mockResolvedValue({ data: PROVINCES_NORMAL, errors: [] });

    const { data } = await alertService.getCachedWeatherData();

    expect(data).toHaveLength(PROVINCES_NORMAL.length);
    expect(data[0].name).toBe('Distrito Nacional');
  });
});
