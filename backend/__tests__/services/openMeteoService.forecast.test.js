'use strict';

const axios       = require('axios');
const MockAdapter = require('axios-mock-adapter');

const axiosMock = new MockAdapter(axios);
const { getHourlyForecast, getDailyForecast7d } = require('../../src/services/openMeteoService');

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// ─── Fixtures de respuesta Open-Meteo ─────────────────────────────────────────

const HOURLY_RESPONSE = {
  hourly: {
    time: [
      '2026-11-03T00:00','2026-11-03T01:00','2026-11-03T02:00',
      '2026-11-03T03:00','2026-11-03T04:00','2026-11-03T05:00',
      '2026-11-03T06:00','2026-11-03T07:00','2026-11-03T08:00',
      '2026-11-03T09:00','2026-11-03T10:00','2026-11-03T11:00',
      '2026-11-03T12:00','2026-11-03T13:00','2026-11-03T14:00',
      '2026-11-03T15:00','2026-11-03T16:00','2026-11-03T17:00',
      '2026-11-03T18:00','2026-11-03T19:00','2026-11-03T20:00',
      '2026-11-03T21:00','2026-11-03T22:00','2026-11-03T23:00',
    ],
    temperature_2m:            [25,26,27,28,29,30,25,26,27,28,29,30,25,26,27,28,29,30,25,26,27,28,29,30],
    precipitation_probability: Array(24).fill(10),
    precipitation:             Array(24).fill(0.2),
    wind_speed_10m:            Array(24).fill(15),
    wind_gusts_10m:            Array(24).fill(22),
    relative_humidity_2m:      Array(24).fill(72),
    cloud_cover:               Array(24).fill(30),
    uv_index:                  Array(24).fill(5),
  },
};

const DAILY_RESPONSE = {
  daily: {
    time:                         ['2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08','2026-11-09'],
    weather_code:                 [1,  61,  3,  1,  80, 1,  2],
    temperature_2m_max:           [31, 28, 29, 30,  27, 31, 30],
    temperature_2m_min:           [23, 22, 22, 23,  21, 23, 22],
    precipitation_probability_max:[10, 65, 30, 15,  75, 10, 20],
    precipitation_sum:            [0.5,12.3, 3.1, 0.8,18.2, 0.2, 1.5],
    wind_speed_10m_max:           [22, 30, 25, 20,  35, 18, 24],
  },
};

afterEach(() => {
  axiosMock.reset();
});

afterAll(() => {
  axiosMock.restore();
});

// ─── getHourlyForecast ────────────────────────────────────────────────────────

describe('openMeteoService.getHourlyForecast()', () => {
  beforeEach(() => {
    axiosMock.onGet(BASE_URL).reply(200, HOURLY_RESPONSE);
  });

  test('devuelve exactamente 24 slots (una hora cada uno)', async () => {
    const result = await getHourlyForecast(18.47, -69.95);
    expect(result).toHaveLength(24);
  });

  test('cada slot contiene los campos requeridos', async () => {
    const [slot] = await getHourlyForecast(18.47, -69.95);
    expect(slot).toMatchObject({
      time:        expect.any(String),
      temp_c:      expect.any(Number),
      precip_prob: expect.any(Number),
      precip_mm:   expect.any(Number),
      wind_kph:    expect.any(Number),
      gusts_kph:   expect.any(Number),
      humidity:    expect.any(Number),
      cloud:       expect.any(Number),
      uv:          expect.any(Number),
    });
  });

  test('los slots son cada hora (horas 0,1,2,...,23)', async () => {
    const result = await getHourlyForecast(18.47, -69.95);
    const hours = result.map(s => s.time.split('T')[1].slice(0, 2)).map(Number);
    expect(hours).toEqual([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]);
  });

  test('los valores del primer slot coinciden con los datos del fixture', async () => {
    const [slot] = await getHourlyForecast(18.47, -69.95);
    expect(slot.temp_c).toBe(25);
    expect(slot.wind_kph).toBe(15);
    expect(slot.humidity).toBe(72);
    expect(slot.cloud).toBe(30);
    expect(slot.uv).toBe(5);
  });

  test('el tiempo del primer slot es la primera hora del día del fixture', async () => {
    const [slot] = await getHourlyForecast(18.47, -69.95);
    expect(slot.time).toBe('2026-11-03T00:00');
  });

  test('no incluye más de 24 slots (límite del endpoint)', async () => {
    const result = await getHourlyForecast(18.47, -69.95);
    expect(result.length).toBeLessThanOrEqual(24);
  });
});

// ─── getDailyForecast7d ───────────────────────────────────────────────────────

describe('openMeteoService.getDailyForecast7d()', () => {
  beforeEach(() => {
    axiosMock.onGet(BASE_URL).reply(200, DAILY_RESPONSE);
  });

  test('devuelve exactamente 7 días', async () => {
    const result = await getDailyForecast7d(18.47, -69.95);
    expect(result).toHaveLength(7);
  });

  test('cada día contiene los campos requeridos', async () => {
    const [day] = await getDailyForecast7d(18.47, -69.95);
    expect(day).toMatchObject({
      date:        expect.any(String),
      condition:   expect.objectContaining({ text: expect.any(String) }),
      maxtemp_c:   expect.any(Number),
      mintemp_c:   expect.any(Number),
      precip_prob: expect.any(Number),
      precip_mm:   expect.any(Number),
      maxwind_kph: expect.any(Number),
    });
  });

  test('las fechas tienen formato YYYY-MM-DD', async () => {
    const result = await getDailyForecast7d(18.47, -69.95);
    for (const day of result) {
      expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('los valores del día 1 coinciden con el fixture', async () => {
    const [day] = await getDailyForecast7d(18.47, -69.95);
    expect(day.date).toBe('2026-11-03');
    expect(day.maxtemp_c).toBe(31);
    expect(day.mintemp_c).toBe(23);
    expect(day.precip_prob).toBe(10);
    expect(day.precip_mm).toBe(0.5);
    expect(day.maxwind_kph).toBe(22);
  });

  test('weather_code 61 (lluvia moderada) se convierte a condición con texto no vacío', async () => {
    const result = await getDailyForecast7d(18.47, -69.95);
    // índice 1 = weather_code 61
    expect(result[1].condition.text).toBeTruthy();
    expect(typeof result[1].condition.text).toBe('string');
  });

  test('el día de mayor lluvia (índice 4, 75%) refleja la probabilidad del fixture', async () => {
    const result = await getDailyForecast7d(18.47, -69.95);
    expect(result[4].precip_prob).toBe(75);
    expect(result[4].precip_mm).toBe(18.2);
  });
});
