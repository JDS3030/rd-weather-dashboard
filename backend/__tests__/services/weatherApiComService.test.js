'use strict';

// Tests del servicio WeatherAPI.com (weatherApiComService.js)
const axios       = require('axios');
const MockAdapter = require('axios-mock-adapter');

const axiosMock           = new MockAdapter(axios);
const weatherApiComService = require('../../src/services/weatherApiComService');

const BASE_URL = 'http://api.weatherapi.com/v1/forecast.json';

// testTimeout de 30 s configurado en vitest.config.mjs
const buildWeatherApiResponse = () => ({
  current: {
    temp_c:      30.0,
    feelslike_c: 33.0,
    humidity:    70,
    wind_kph:    15.0,
    wind_dir:    'NE',
    pressure_mb: 1012.0,
    vis_km:      10.0,
    uv:          8,
    precip_mm:   0.0,
    cloud:       25,
    last_updated: '2026-06-24 10:00',
    condition: {
      text: 'Soleado',
      code: 1000,
      icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
    },
  },
  forecast: {
    forecastday: [
      {
        date: '2026-06-24',
        day: {
          maxtemp_c:            33.0,
          mintemp_c:            26.0,
          avgtemp_c:            29.5,
          daily_chance_of_rain: 10,
          totalprecip_mm:       0.0,
          maxwind_kph:          20.0,
          condition: { text: 'Soleado', code: 1000, icon: '//cdn.weatherapi.com/weather/64x64/day/113.png' },
        },
      },
      {
        date: '2026-06-25',
        day: {
          maxtemp_c:            32.0,
          mintemp_c:            25.5,
          avgtemp_c:            28.5,
          daily_chance_of_rain: 20,
          totalprecip_mm:       0.5,
          maxwind_kph:          18.0,
          condition: { text: 'Parcialmente nublado', code: 1003, icon: '//cdn.weatherapi.com/weather/64x64/day/116.png' },
        },
      },
      {
        date: '2026-06-26',
        day: {
          maxtemp_c:            31.0,
          mintemp_c:            25.0,
          avgtemp_c:            28.0,
          daily_chance_of_rain: 15,
          totalprecip_mm:       0.0,
          maxwind_kph:          22.0,
          condition: { text: 'Soleado', code: 1000, icon: '//cdn.weatherapi.com/weather/64x64/day/113.png' },
        },
      },
    ],
  },
  alerts: { alert: [] },
});

beforeEach(() => {
  process.env.WEATHERAPI_KEY = 'test-api-key-123';
});

afterEach(() => {
  axiosMock.reset();
  delete process.env.WEATHERAPI_KEY;
});

afterAll(() => axiosMock.restore());

// ─── getSingleProvinceWeather ──────────────────────────────────────────────────

describe('getSingleProvinceWeather()', () => {
  test('lanza error si WEATHERAPI_KEY no está configurada', async () => {
    delete process.env.WEATHERAPI_KEY;

    await expect(
      weatherApiComService.getSingleProvinceWeather('distrito_nacional')
    ).rejects.toThrow('WEATHERAPI_KEY no está configurada');
  });

  test('lanza error 404 si el provinceId no existe', async () => {
    await expect(
      weatherApiComService.getSingleProvinceWeather('provincia_inexistente')
    ).rejects.toMatchObject({ status: 404 });
  });

  test('mapea correctamente temp_c, feelslike_c y humidity', async () => {
    axiosMock.onGet(BASE_URL).reply(200, buildWeatherApiResponse());

    const result = await weatherApiComService.getSingleProvinceWeather('distrito_nacional');

    expect(result.current.temp_c).toBe(30.0);
    expect(result.current.feelslike_c).toBe(33.0);
    expect(result.current.humidity).toBe(70);
  });

  test('mapea wind_kph y wind_dir correctamente', async () => {
    axiosMock.onGet(BASE_URL).reply(200, buildWeatherApiResponse());

    const result = await weatherApiComService.getSingleProvinceWeather('distrito_nacional');

    expect(result.current.wind_kph).toBe(15.0);
    expect(result.current.wind_dir).toBe('NE');
  });

  test('agrega "https:" al icono de condition', async () => {
    axiosMock.onGet(BASE_URL).reply(200, buildWeatherApiResponse());

    const result = await weatherApiComService.getSingleProvinceWeather('distrito_nacional');

    expect(result.current.condition.icon).toMatch(/^https:\/\//);
  });

  test('source es "WeatherAPI.com"', async () => {
    axiosMock.onGet(BASE_URL).reply(200, buildWeatherApiResponse());

    const result = await weatherApiComService.getSingleProvinceWeather('distrito_nacional');

    expect(result.source).toBe('WeatherAPI.com');
  });

  test('forecast contiene 3 días con todos los campos requeridos', async () => {
    axiosMock.onGet(BASE_URL).reply(200, buildWeatherApiResponse());

    const result = await weatherApiComService.getSingleProvinceWeather('distrito_nacional');

    expect(result.forecast).toHaveLength(3);
    expect(result.forecast[0]).toMatchObject({
      date:                 expect.any(String),
      maxtemp_c:            expect.any(Number),
      mintemp_c:            expect.any(Number),
      avgtemp_c:            expect.any(Number),
      daily_chance_of_rain: expect.any(Number),
      totalprecip_mm:       expect.any(Number),
      maxwind_kph:          expect.any(Number),
    });
  });

  test('el icono del forecast también lleva "https:"', async () => {
    axiosMock.onGet(BASE_URL).reply(200, buildWeatherApiResponse());

    const result = await weatherApiComService.getSingleProvinceWeather('distrito_nacional');

    expect(result.forecast[0].condition.icon).toMatch(/^https:\/\//);
  });

  test('alerts es array vacío cuando la API no reporta alertas', async () => {
    axiosMock.onGet(BASE_URL).reply(200, buildWeatherApiResponse());

    const result = await weatherApiComService.getSingleProvinceWeather('distrito_nacional');

    expect(result.alerts).toEqual([]);
  });

  test('incluye id, name y region de la provincia', async () => {
    axiosMock.onGet(BASE_URL).reply(200, buildWeatherApiResponse());

    const result = await weatherApiComService.getSingleProvinceWeather('distrito_nacional');

    expect(result.id).toBe('distrito_nacional');
    expect(result.name).toBe('Distrito Nacional');
    expect(result.region).toBe('Sur');
  });

  test('lanza error si la API responde con 401 (clave inválida)', async () => {
    axiosMock.onGet(BASE_URL).reply(401, { error: { code: 2006, message: 'API key is invalid' } });

    await expect(
      weatherApiComService.getSingleProvinceWeather('distrito_nacional')
    ).rejects.toThrow();
  });
});

// ─── getAllProvincesWeather ────────────────────────────────────────────────────

describe('getAllProvincesWeather()', () => {
  test('lanza error si WEATHERAPI_KEY no está configurada', async () => {
    delete process.env.WEATHERAPI_KEY;

    await expect(
      weatherApiComService.getAllProvincesWeather()
    ).rejects.toThrow('WEATHERAPI_KEY no está configurada');
  });

  test('retorna { data, errors } con data para todas las provincias en éxito total', async () => {
    axiosMock.onGet(BASE_URL).reply(200, buildWeatherApiResponse());

    const { data, errors } = await weatherApiComService.getAllProvincesWeather();

    expect(data.length).toBeGreaterThan(0);
    expect(errors).toHaveLength(0);
  });

  test('registra la provincia fallida en errors sin detener el resto', async () => {
    axiosMock
      .onGet(BASE_URL).replyOnce(500)
      .onGet(BASE_URL).reply(200, buildWeatherApiResponse());

    const { errors } = await weatherApiComService.getAllProvincesWeather();

    expect(errors.length).toBeGreaterThanOrEqual(1);
    expect(errors[0]).toHaveProperty('province');
    expect(errors[0]).toHaveProperty('error');
  });

  test('lanza error si todas las provincias fallan (data vacía)', async () => {
    axiosMock.onGet(BASE_URL).reply(500);

    await expect(
      weatherApiComService.getAllProvincesWeather()
    ).rejects.toThrow('WeatherAPI no devolvió datos para ninguna provincia');
  });
});
