'use strict';

const {
  detectFromWeather,
  detectFromOnamet,
  computeAlertLevel,
} = require('../../src/services/alertDetector');

const { ALERT_LEVELS } = require('../../src/config/constants');

const {
  makeProvince,
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

// ─── detectFromWeather ────────────────────────────────────────────────────────

describe('detectFromWeather()', () => {
  test('retorna array vacío con provincias en condiciones normales', () => {
    const result = detectFromWeather(PROVINCES_NORMAL);
    expect(result).toHaveLength(0);
  });

  test('retorna array vacío con array de provincias vacío', () => {
    expect(detectFromWeather([])).toHaveLength(0);
  });

  // Estrategia 3 — umbral de viento
  test('wind_kph ≥ 119 genera trigger "Huracán Categoría 1+" desde WeatherAPI-Wind', () => {
    const triggers = detectFromWeather([PROVINCE_HURRICANE_WIND]);
    const wind = triggers.find(t => t.source === 'WeatherAPI-Wind');
    expect(wind).toBeDefined();
    expect(wind.level).toMatch(/Huracán/);
    expect(wind.province).toBe('Monte Cristi');
    expect(wind.windKph).toBe(125);
  });

  test('wind_kph ≥ 63 y < 119 genera trigger "Tormenta Tropical"', () => {
    const triggers = detectFromWeather([PROVINCE_TROPICAL_STORM_WIND]);
    const wind = triggers.find(t => t.source === 'WeatherAPI-Wind');
    expect(wind).toBeDefined();
    expect(wind.level).toMatch(/Tormenta/);
    expect(wind.windKph).toBe(75);
  });

  test('wind_kph = 118 (justo antes del umbral de huracán) → Tormenta Tropical', () => {
    const province = makeProvince({ current: { ...makeProvince().current, wind_kph: 118 } });
    const triggers = detectFromWeather([province]);
    const wind = triggers.find(t => t.source === 'WeatherAPI-Wind');
    expect(wind.level).toMatch(/Tormenta/);
  });

  test('wind_kph = 119 (umbral exacto de huracán) → Huracán', () => {
    const province = makeProvince({ current: { ...makeProvince().current, wind_kph: 119 } });
    const triggers = detectFromWeather([province]);
    const wind = triggers.find(t => t.source === 'WeatherAPI-Wind');
    expect(wind.level).toMatch(/Huracán/);
  });

  test('wind_kph = 62 (por debajo de tormenta tropical) → sin trigger de viento', () => {
    const province = makeProvince({ current: { ...makeProvince().current, wind_kph: 62 } });
    const triggers = detectFromWeather([province]);
    expect(triggers.filter(t => t.source === 'WeatherAPI-Wind')).toHaveLength(0);
  });

  // Estrategia 2 — texto de condición
  test('keyword "hurricane" en condition.text genera trigger WeatherAPI-Condition', () => {
    const triggers = detectFromWeather([PROVINCE_HURRICANE_CONDITION]);
    const cond = triggers.find(t => t.source === 'WeatherAPI-Condition');
    expect(cond).toBeDefined();
    expect(cond.province).toBe('Nagua');
    expect(cond.keyword).toBe('hurricane');
  });

  test('keyword "tormenta tropical" en condition.text (case-insensitive)', () => {
    const triggers = detectFromWeather([PROVINCE_TROPICAL_STORM_TEXT]);
    const cond = triggers.find(t => t.source === 'WeatherAPI-Condition');
    expect(cond).toBeDefined();
    expect(cond.keyword).toMatch(/tormenta tropical/i);
  });

  test('condición normal sin keywords → sin trigger de condición', () => {
    const province = makeProvince({
      current: { ...makeProvince().current, condition: { text: 'Parcialmente nublado', code: 1003 } },
    });
    const triggers = detectFromWeather([province]);
    expect(triggers.filter(t => t.source === 'WeatherAPI-Condition')).toHaveLength(0);
  });

  // Estrategia 1 — alertas oficiales
  test('keyword en evento de alerta oficial genera trigger WeatherAPI-Alert', () => {
    const triggers = detectFromWeather([PROVINCE_WEATHERAPI_ALERT]);
    const alert = triggers.find(t => t.source === 'WeatherAPI-Alert');
    expect(alert).toBeDefined();
    expect(alert.province).toBe('Puerto Plata');
    expect(alert.keyword).toBeDefined();
  });

  test('province.alerts = [] → sin trigger de alerta oficial', () => {
    const province = makeProvince({ alerts: [] });
    const triggers = detectFromWeather([province]);
    expect(triggers.filter(t => t.source === 'WeatherAPI-Alert')).toHaveLength(0);
  });

  test('province sin propiedad alerts → sin error y sin trigger', () => {
    const province = makeProvince();
    delete province.alerts;
    expect(() => detectFromWeather([province])).not.toThrow();
  });

  test('province sin current → sin error y sin trigger de viento', () => {
    const province = { id: 'x', name: 'Test', alerts: [] };
    const triggers = detectFromWeather([province]);
    expect(triggers.filter(t => t.source === 'WeatherAPI-Wind')).toHaveLength(0);
  });

  test('múltiples provincias con alertas distintas genera triggers para cada una', () => {
    const triggers = detectFromWeather([PROVINCE_HURRICANE_WIND, PROVINCE_TROPICAL_STORM_WIND]);
    const windTriggers = triggers.filter(t => t.source === 'WeatherAPI-Wind');
    expect(windTriggers).toHaveLength(2);
    expect(windTriggers.map(t => t.province)).toContain('Monte Cristi');
    expect(windTriggers.map(t => t.province)).toContain('Puerto Plata');
  });
});

// ─── detectFromOnamet ─────────────────────────────────────────────────────────

describe('detectFromOnamet()', () => {
  test('retorna array vacío con lista de alertas vacía', () => {
    expect(detectFromOnamet([])).toHaveLength(0);
  });

  test('incluye alertas con severity "emergency"', () => {
    const result = detectFromOnamet([ONAMET_EMERGENCY_ALERT]);
    expect(result).toHaveLength(1);
    expect(result[0].source).toBe('ONAMET');
    expect(result[0].severity).toBe('emergency');
  });

  test('incluye alertas con severity "warning"', () => {
    const result = detectFromOnamet([ONAMET_WARNING_ALERT]);
    expect(result).toHaveLength(1);
    expect(result[0].severity).toBe('warning');
  });

  test('excluye alertas con severity "watch"', () => {
    const result = detectFromOnamet([ONAMET_WATCH_ALERT]);
    expect(result).toHaveLength(0);
  });

  test('el trigger ONAMET contiene title, description, type y severity', () => {
    const [trigger] = detectFromOnamet([ONAMET_EMERGENCY_ALERT]);
    expect(trigger.title).toBe(ONAMET_EMERGENCY_ALERT.title);
    expect(trigger.description).toBe(ONAMET_EMERGENCY_ALERT.description);
    expect(trigger.type).toBe(ONAMET_EMERGENCY_ALERT.type);
  });

  test('mezcla de severidades: solo emergency y warning son incluidas', () => {
    const alerts = [ONAMET_EMERGENCY_ALERT, ONAMET_WARNING_ALERT, ONAMET_WATCH_ALERT];
    const result = detectFromOnamet(alerts);
    expect(result).toHaveLength(2);
  });
});

// ─── computeAlertLevel ────────────────────────────────────────────────────────

describe('computeAlertLevel()', () => {
  test('lista vacía → "normal"', () => {
    expect(computeAlertLevel([])).toBe(ALERT_LEVELS.NORMAL);
  });

  test('trigger de viento con level "Huracán" → "emergency"', () => {
    const triggers = [{ source: 'WeatherAPI-Wind', level: 'Huracán Categoría 1+' }];
    expect(computeAlertLevel(triggers)).toBe(ALERT_LEVELS.EMERGENCY);
  });

  test('trigger ONAMET con severity "emergency" → "emergency"', () => {
    const triggers = [{ source: 'ONAMET', severity: 'emergency' }];
    expect(computeAlertLevel(triggers)).toBe(ALERT_LEVELS.EMERGENCY);
  });

  test('trigger ONAMET con severity "warning" → "warning"', () => {
    const triggers = [{ source: 'ONAMET', severity: 'warning' }];
    expect(computeAlertLevel(triggers)).toBe(ALERT_LEVELS.WARNING);
  });

  test('trigger de condición sin severity → "watch"', () => {
    const triggers = [{ source: 'WeatherAPI-Condition', keyword: 'hurricane' }];
    expect(computeAlertLevel(triggers)).toBe(ALERT_LEVELS.WATCH);
  });

  test('trigger de tormenta tropical (sin huracán) → "watch"', () => {
    const triggers = [{ source: 'WeatherAPI-Wind', level: 'Tormenta Tropical', windKph: 75 }];
    expect(computeAlertLevel(triggers)).toBe(ALERT_LEVELS.WATCH);
  });

  test('emergency tiene prioridad sobre warning', () => {
    const triggers = [
      { source: 'ONAMET', severity: 'warning' },
      { source: 'WeatherAPI-Wind', level: 'Huracán Categoría 1+' },
    ];
    expect(computeAlertLevel(triggers)).toBe(ALERT_LEVELS.EMERGENCY);
  });

  test('warning tiene prioridad sobre watch', () => {
    const triggers = [
      { source: 'WeatherAPI-Condition', keyword: 'flood warning' },
      { source: 'ONAMET', severity: 'warning' },
    ];
    expect(computeAlertLevel(triggers)).toBe(ALERT_LEVELS.WARNING);
  });
});
