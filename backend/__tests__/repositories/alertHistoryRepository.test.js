'use strict';

// Convención del repo: vi.spyOn sobre módulos reales (CJS, sin hoisting).
// El módulo db/pool expone isEnabled()/query(), fáciles de espiar para simular
// el modo con-DB y sin-DB sin depender de DATABASE_URL ni de mocks de 'pg'.

const repo = require('../../src/repositories/alertHistoryRepository');
const db   = require('../../src/db/pool');

afterEach(() => vi.restoreAllMocks());

// ─── Modo sin-DB ────────────────────────────────────────────────────────────

describe('alertHistoryRepository — modo sin-DB (persistencia deshabilitada)', () => {
  beforeEach(() => {
    vi.spyOn(db, 'isEnabled').mockReturnValue(false);
    vi.spyOn(db, 'query');
  });

  test('insert() es no-op y no toca la DB', async () => {
    await expect(
      repo.insert({ fromLevel: 'normal', toLevel: 'warning', triggerCount: 1 })
    ).resolves.toBeUndefined();
    expect(db.query).not.toHaveBeenCalled();
  });

  test('getRecent() devuelve [] sin tocar la DB', async () => {
    await expect(repo.getRecent()).resolves.toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });
});

// ─── Modo con-DB ──────────────────────────────────────────────────────────────

describe('alertHistoryRepository — modo con-DB', () => {
  let querySpy;

  beforeEach(() => {
    vi.spyOn(db, 'isEnabled').mockReturnValue(true);
    querySpy = vi.spyOn(db, 'query').mockResolvedValue({ rows: [] });
  });

  test('insert() ejecuta el INSERT con los parámetros correctos', async () => {
    const triggers = [{ source: 'WeatherAPI-Wind', province: 'Monte Cristi' }];
    await repo.insert({
      fromLevel: 'warning', toLevel: 'emergency',
      triggerCount: 2, province: 'Monte Cristi', triggers,
    });

    expect(querySpy).toHaveBeenCalledTimes(1);
    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/INSERT INTO alert_history/);
    expect(params).toEqual([
      'warning', 'emergency', 2, 'Monte Cristi', JSON.stringify(triggers),
    ]);
  });

  test('insert() aplica defaults (triggerCount 0, province null, triggers [])', async () => {
    await repo.insert({ fromLevel: 'watch', toLevel: 'normal' });

    const [, params] = querySpy.mock.calls[0];
    expect(params).toEqual(['watch', 'normal', 0, null, '[]']);
  });

  test('insert() captura un fallo de la DB sin propagarlo', async () => {
    querySpy.mockRejectedValueOnce(new Error('connection refused'));
    await expect(
      repo.insert({ fromLevel: 'normal', toLevel: 'warning' })
    ).resolves.toBeUndefined();
  });

  test('getRecent() consulta con LIMIT y mapea las filas a la forma de API', async () => {
    const createdAt = new Date('2026-07-07T18:30:00.000Z');
    querySpy.mockResolvedValueOnce({
      rows: [{
        id: '42', from_level: 'warning', to_level: 'emergency',
        trigger_count: 3, province: 'Monte Cristi',
        triggers: [{ source: 'WeatherAPI-Wind' }], created_at: createdAt,
      }],
    });

    const result = await repo.getRecent(10);

    const [sql, params] = querySpy.mock.calls[0];
    expect(sql).toMatch(/ORDER BY created_at DESC/);
    expect(params).toEqual([10]);
    expect(result).toEqual([{
      id: 42, from: 'warning', to: 'emergency', triggerCount: 3,
      province: 'Monte Cristi', triggers: [{ source: 'WeatherAPI-Wind' }],
      createdAt: '2026-07-07T18:30:00.000Z',
    }]);
  });

  test('getRecent() recorta el limit al máximo permitido (200)', async () => {
    await repo.getRecent(9999);
    expect(querySpy.mock.calls[0][1]).toEqual([repo.MAX_LIMIT]);
  });

  test('getRecent() usa el default cuando el limit es inválido', async () => {
    await repo.getRecent('abc');
    expect(querySpy.mock.calls[0][1]).toEqual([repo.DEFAULT_LIMIT]);
  });

  test('getRecent() devuelve [] si la lectura falla', async () => {
    querySpy.mockRejectedValueOnce(new Error('timeout'));
    await expect(repo.getRecent()).resolves.toEqual([]);
  });
});
