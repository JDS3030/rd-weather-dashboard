'use strict';

import { describe, test, expect, vi, beforeEach } from 'vitest';

// ─── Mocks de dependencias externas ──────────────────────────────────────────

vi.mock('../../src/services/weatherProviderService', () => ({
  getSingleProvinceWeather: vi.fn().mockResolvedValue({
    id: 'santiago', name: 'Santiago', region: 'Cibao Norte',
    current: {
      temp_c: 29, feelslike_c: 31, humidity: 70, wind_kph: 20,
      wind_dir: 'NE', pressure_mb: 1013, vis_km: 10,
      uv: 7, precip_mm: 0, cloud: 30,
      condition: { text: 'Parcialmente nublado', code: 1003 },
    },
    forecast: [], alerts: [],
    lastUpdated: '2026-11-03T12:00:00.000Z',
    source: 'WeatherAPI.com',
  }),
}));

vi.mock('../../src/services/openMeteoService', () => ({
  getHourlyForecast: vi.fn().mockResolvedValue([
    { time: '2026-11-03T12:00', temp_c: 29, precip_prob: 10, wind_kph: 18, gusts_kph: 25, humidity: 70, cloud: 30, uv: 7 },
    { time: '2026-11-03T15:00', temp_c: 31, precip_prob: 20, wind_kph: 22, gusts_kph: 30, humidity: 65, cloud: 45, uv: 9 },
  ]),
  getDailyForecast7d: vi.fn().mockResolvedValue([
    { date: '2026-11-03', condition: { text: 'Parcialmente nublado' }, maxtemp_c: 31, mintemp_c: 23, precip_prob: 15, precip_mm: 1.2, maxwind_kph: 25 },
    { date: '2026-11-04', condition: { text: 'Lluvia dispersa' },      maxtemp_c: 28, mintemp_c: 22, precip_prob: 55, precip_mm: 8.5, maxwind_kph: 30 },
  ]),
}));

vi.mock('../../src/services/alertService', () => ({
  getAlertState: vi.fn().mockReturnValue({
    level: 'normal', isEmergency: false, triggers: [], onaMetAlerts: [],
  }),
}));

// ─── Import del servicio ──────────────────────────────────────────────────────

import { generateWeatherAnalysis } from '../../src/services/assistantService';

// ─── Cliente Anthropic simulado (inyectado para evitar API real) ──────────────

const mockCreate = vi.fn().mockResolvedValue({
  content: [{ type: 'text', text: '## Resumen Ejecutivo\nCondiciones normales en Santiago.\n\n## Pronóstico Horario\n...' }],
});

const mockAnthropicClient = { messages: { create: mockCreate } };

beforeEach(() => {
  mockCreate.mockClear();
  process.env.ANTHROPIC_API_KEY = 'test-key-123';
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('assistantService.generateWeatherAnalysis()', () => {
  test('retorna markdown + metadatos para provincia válida', async () => {
    const result = await generateWeatherAnalysis('santiago', '¿Cómo está el tiempo?', mockAnthropicClient);

    expect(result).toMatchObject({
      provinceId:  'santiago',
      province:    'Santiago',
      generatedAt: expect.any(String),
      markdown:    expect.stringContaining('Resumen Ejecutivo'),
    });
  });

  test('llama a Anthropic messages.create exactamente una vez', async () => {
    await generateWeatherAnalysis('santiago', '¿Cuál es el pronóstico?', mockAnthropicClient);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test('pasa el system prompt y los datos al modelo', async () => {
    await generateWeatherAnalysis('santiago', '¿Habrá lluvia?', mockAnthropicClient);

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.model).toBe('claude-haiku-4-5-20251001');
    expect(callArgs.system).toContain('Meteorological Assistant');
    expect(callArgs.messages[0].content).toContain('Santiago');
    expect(callArgs.messages[0].content).toContain('¿Habrá lluvia?');
  });

  test('lanza error 400 cuando provinceId no existe', async () => {
    await expect(
      generateWeatherAnalysis('no_existe', '¿Cómo está?', mockAnthropicClient)
    ).rejects.toMatchObject({ status: 400 });
  });

  test('lanza error 503 cuando ANTHROPIC_API_KEY no está configurada y no hay cliente inyectado', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    await expect(generateWeatherAnalysis('santiago', '¿Cómo está?')).rejects.toMatchObject({ status: 503 });
  });

  test('generatedAt es un ISO string válido', async () => {
    const result = await generateWeatherAnalysis('santiago', '¿Cuál es el pronóstico?', mockAnthropicClient);
    const dt = new Date(result.generatedAt);
    expect(dt.getTime()).not.toBeNaN();
  });
});
