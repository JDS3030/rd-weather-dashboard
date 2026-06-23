'use strict';

// Tests del servicio Open-Meteo (openMeteoService.js)
const axios       = require('axios');
const MockAdapter = require('axios-mock-adapter');

const axiosMock        = new MockAdapter(axios);
const openMeteoService = require('../../src/services/openMeteoService');

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

// Respuesta simulada de Open-Meteo (nombres de campo reales de la API)
const buildOpenMeteoResponse = () => ({
  current: {
    temperature_2m:        31.2,
    apparent_temperature:  33.0,
    relative_humidity_2m:  68,
    wind_speed_10m:        22,
    wind_direction_10m:    90,
    pressure_msl:          1012,
    visibility:            10000,
    uv_index:              8,
    precipitation:         0,
    cloud_cover:           15,
    weather_code:          0,
  },
  daily: {
    time:                          ['2026-06-22', '2026-06-23', '2026-06-24'],
    temperature_2m_max:            [33.0, 32.0, 31.0],
    temperature_2m_min:            [26.0, 25.5, 25.0],
    precipitation_probability_max: [10, 20, 15],
    precipitation_sum:             [0, 0.5, 0],
    wind_speed_10m_max:            [25, 28, 22],
    weather_code:                  [0, 2, 1],
  },
});

afterEach(() => axiosMock.reset());
afterAll(()  => axiosMock.restore());

// ─── getSingleProvinceWeather ──────────────────────────────────────────────────

describe('getSingleProvinceWeather()', () => {
  test('lanza error 404 si el provinceId no existe', async () => {
    await expect(
      openMeteoService.getSingleProvinceWeather('provincia_inexistente')
    ).rejects.toMatchObject({ status: 404 });
  });

  test('mapea correctamente temp_c desde Open-Meteo (temperature_2m)', async () => {
    axiosMock.onGet(OPEN_METEO_URL).reply(200, buildOpenMeteoResponse());

    const result = await openMeteoService.getSingleProvinceWeather('distrito_nacional');

    expect(result.current.temp_c).toBe(31.2);
    expect(result.current.feelslike_c).toBe(33.0);
    expect(result.current.humidity).toBe(68);
  });

  test('mapea wind_kph desde wind_speed_10m', async () => {
    axiosMock.onGet(OPEN_METEO_URL).reply(200, buildOpenMeteoResponse());

    const result = await openMeteoService.getSingleProvinceWeather('distrito_nacional');

    expect(result.current.wind_kph).toBe(22);
  });

  test('mapea condition.text desde WMO code 0 → "Despejado"', async () => {
    axiosMock.onGet(OPEN_METEO_URL).reply(200, buildOpenMeteoResponse());

    const result = await openMeteoService.getSingleProvinceWeather('distrito_nacional');

    expect(result.current.condition.text).toMatch(/despejado|principalmente/i);
  });

  test('condition tiene text y code (Open-Meteo no provee icon directo)', async () => {
    axiosMock.onGet(OPEN_METEO_URL).reply(200, buildOpenMeteoResponse());

    const result = await openMeteoService.getSingleProvinceWeather('distrito_nacional');

    // openMeteoService retorna { text, code } — sin campo icon
    expect(result.current.condition.text).toBeDefined();
    expect(result.current.condition.code).toBeDefined();
  });

  test('alerts siempre es array vacío (Open-Meteo no provee alertas)', async () => {
    axiosMock.onGet(OPEN_METEO_URL).reply(200, buildOpenMeteoResponse());

    const result = await openMeteoService.getSingleProvinceWeather('distrito_nacional');

    expect(result.alerts).toEqual([]);
  });

  test('forecast contiene 3 días', async () => {
    axiosMock.onGet(OPEN_METEO_URL).reply(200, buildOpenMeteoResponse());

    const result = await openMeteoService.getSingleProvinceWeather('distrito_nacional');

    expect(result.forecast).toHaveLength(3);
    expect(result.forecast[0]).toHaveProperty('maxtemp_c');
    expect(result.forecast[0]).toHaveProperty('mintemp_c');
  });

  test('incluye id, name y region de la provincia', async () => {
    axiosMock.onGet(OPEN_METEO_URL).reply(200, buildOpenMeteoResponse());

    const result = await openMeteoService.getSingleProvinceWeather('distrito_nacional');

    expect(result.id).toBe('distrito_nacional');
    expect(result.name).toBe('Distrito Nacional');
    expect(result.region).toBe('Sur');
  });
});

// ─── getAllProvincesWeather ────────────────────────────────────────────────────

describe('getAllProvincesWeather()', () => {
  test('retorna data para todas las provincias en éxito total', async () => {
    axiosMock.onGet(OPEN_METEO_URL).reply(200, buildOpenMeteoResponse());

    const { data, errors } = await openMeteoService.getAllProvincesWeather();

    expect(data.length).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('NO lanza excepción cuando alguna provincia falla (Promise.allSettled)', async () => {
    axiosMock.onGet(OPEN_METEO_URL).replyOnce(500).onGet(OPEN_METEO_URL).reply(200, buildOpenMeteoResponse());

    await expect(openMeteoService.getAllProvincesWeather()).resolves.not.toThrow();
  });

  test('retorna errors para provincias que fallaron', async () => {
    axiosMock.onGet(OPEN_METEO_URL).replyOnce(500, { reason: 'server error' });
    axiosMock.onGet(OPEN_METEO_URL).reply(200, buildOpenMeteoResponse());

    const { errors } = await openMeteoService.getAllProvincesWeather();

    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0]).toHaveProperty('province');
    expect(errors[0]).toHaveProperty('error');
  });
});
