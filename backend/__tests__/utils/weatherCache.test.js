'use strict';

const { WeatherCache, DEFAULT_TTL_MS } = require('../../src/utils/weatherCache');

const SAMPLE_DATA = [
  { id: 'santo_domingo', name: 'Distrito Nacional', current: { temp_c: 31 } },
  { id: 'santiago',      name: 'Santiago',          current: { temp_c: 29 } },
];

// ─── Estado inicial ───────────────────────────────────────────────────────────

describe('WeatherCache — estado inicial', () => {
  let cache;
  beforeEach(() => { cache = new WeatherCache(); });

  test('hasData() retorna false antes de cualquier set()', () => {
    expect(cache.hasData()).toBe(false);
  });

  test('isExpired() retorna true sin fetch timestamp', () => {
    expect(cache.isExpired()).toBe(true);
  });

  test('get() retorna data null al iniciar', () => {
    expect(cache.get().data).toBeNull();
  });

  test('get() retorna isStale false al iniciar', () => {
    expect(cache.get().isStale).toBe(false);
  });

  test('get() retorna staleFrom null al iniciar', () => {
    expect(cache.get().staleFrom).toBeNull();
  });

  test('DEFAULT_TTL_MS es de 5 minutos (300 000 ms)', () => {
    expect(DEFAULT_TTL_MS).toBe(300_000);
  });
});

// ─── set() ────────────────────────────────────────────────────────────────────

describe('WeatherCache — set()', () => {
  let cache;
  beforeEach(() => { cache = new WeatherCache(); });

  test('hasData() retorna true después de set()', () => {
    cache.set(SAMPLE_DATA);
    expect(cache.hasData()).toBe(true);
  });

  test('isExpired() retorna false inmediatamente después de set()', () => {
    cache.set(SAMPLE_DATA);
    expect(cache.isExpired()).toBe(false);
  });

  test('get().data contiene los datos almacenados', () => {
    cache.set(SAMPLE_DATA);
    expect(cache.get().data).toBe(SAMPLE_DATA);
  });

  test('get().isStale es false después de set() limpio', () => {
    cache.set(SAMPLE_DATA);
    expect(cache.get().isStale).toBe(false);
  });

  test('set() resetea isStale a false cuando había datos obsoletos', () => {
    cache.set(SAMPLE_DATA);
    cache.markStale();
    expect(cache.get().isStale).toBe(true);

    cache.set(SAMPLE_DATA); // nuevo fetch exitoso
    expect(cache.get().isStale).toBe(false);
  });
});

// ─── markStale() ─────────────────────────────────────────────────────────────

describe('WeatherCache — markStale()', () => {
  let cache;
  beforeEach(() => {
    cache = new WeatherCache();
    cache.set(SAMPLE_DATA);
  });

  test('isStale pasa a true después de markStale()', () => {
    cache.markStale();
    expect(cache.get().isStale).toBe(true);
  });

  test('staleFrom es un ISO string válido cuando isStale=true', () => {
    cache.markStale();
    const { staleFrom } = cache.get();
    expect(staleFrom).not.toBeNull();
    expect(() => new Date(staleFrom)).not.toThrow();
    expect(isNaN(new Date(staleFrom).getTime())).toBe(false);
  });

  test('los datos originales siguen disponibles aunque estén obsoletos', () => {
    cache.markStale();
    expect(cache.get().data).toBe(SAMPLE_DATA);
  });
});

// ─── isExpired() con TTL corto ────────────────────────────────────────────────

describe('WeatherCache — expiración por TTL', () => {
  test('isExpired() retorna true cuando el TTL ha transcurrido', () => {
    const cache = new WeatherCache(50); // TTL de 50 ms
    cache.set(SAMPLE_DATA);
    return new Promise(resolve => {
      setTimeout(() => {
        expect(cache.isExpired()).toBe(true);
        resolve();
      }, 100);
    });
  });

  test('isExpired() retorna false cuando el TTL no ha transcurrido', () => {
    const cache = new WeatherCache(60_000); // TTL de 60 segundos
    cache.set(SAMPLE_DATA);
    expect(cache.isExpired()).toBe(false);
  });
});

// ─── clear() ─────────────────────────────────────────────────────────────────

describe('WeatherCache — clear()', () => {
  let cache;
  beforeEach(() => {
    cache = new WeatherCache();
    cache.set(SAMPLE_DATA);
    cache.markStale();
  });

  test('hasData() retorna false después de clear()', () => {
    cache.clear();
    expect(cache.hasData()).toBe(false);
  });

  test('isExpired() retorna true después de clear()', () => {
    cache.clear();
    expect(cache.isExpired()).toBe(true);
  });

  test('get().data es null después de clear()', () => {
    cache.clear();
    expect(cache.get().data).toBeNull();
  });

  test('get().isStale es false después de clear()', () => {
    cache.clear();
    expect(cache.get().isStale).toBe(false);
  });
});

// ─── TTL personalizado ────────────────────────────────────────────────────────

describe('WeatherCache — TTL personalizado', () => {
  test('acepta TTL personalizado en constructor', () => {
    const shortCache = new WeatherCache(1000);
    shortCache.set(SAMPLE_DATA);
    expect(shortCache.isExpired()).toBe(false);
  });

  test('instancias con distintos TTL son independientes', () => {
    const slow = new WeatherCache(60_000);
    const fast = new WeatherCache(1);
    slow.set(SAMPLE_DATA);
    fast.set(SAMPLE_DATA);

    return new Promise(resolve => {
      setTimeout(() => {
        expect(slow.isExpired()).toBe(false);
        expect(fast.isExpired()).toBe(true);
        resolve();
      }, 10);
    });
  });
});
