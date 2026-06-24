'use strict';

const { getCondition, windDir, WMO_CODES, WIND_DIRECTIONS } = require('../../src/utils/weatherParser');

// ─── getCondition ─────────────────────────────────────────────────────────────

describe('getCondition(wmoCode)', () => {
  test('código 0 → texto "Despejado" y code 1000', () => {
    const result = getCondition(0);
    expect(result.text).toBe('Despejado');
    expect(result.code).toBe(1000);
  });

  test('código 3 → texto "Nublado"', () => {
    expect(getCondition(3).text).toBe('Nublado');
  });

  test('código 61 → texto "Lluvia ligera"', () => {
    expect(getCondition(61).text).toBe('Lluvia ligera');
  });

  test('código 65 → texto "Lluvia intensa"', () => {
    expect(getCondition(65).text).toBe('Lluvia intensa');
  });

  test('código 95 → texto "Tormenta eléctrica" y code 1273', () => {
    const result = getCondition(95);
    expect(result.text).toBe('Tormenta eléctrica');
    expect(result.code).toBe(1273);
  });

  test('código 99 → texto "Tormenta con granizo intenso"', () => {
    expect(getCondition(99).text).toBe('Tormenta con granizo intenso');
  });

  test('código 71 → "Nevada ligera" (relevante para zonas montañosas)', () => {
    expect(getCondition(71).text).toBe('Nevada ligera');
  });

  test('código desconocido (999) → fallback "Variable" con code 1000', () => {
    const result = getCondition(999);
    expect(result.text).toBe('Variable');
    expect(result.code).toBe(1000);
  });

  test('código undefined → fallback "Variable"', () => {
    expect(getCondition(undefined).text).toBe('Variable');
  });

  test('código null → fallback "Variable"', () => {
    expect(getCondition(null).text).toBe('Variable');
  });

  test('todos los códigos documentados existen en WMO_CODES', () => {
    const documentedCodes = [0,1,2,3,45,48,51,53,55,61,63,65,71,73,75,77,80,81,82,85,86,95,96,99];
    for (const code of documentedCodes) {
      expect(WMO_CODES[code]).toBeDefined();
      expect(typeof WMO_CODES[code].text).toBe('string');
    }
  });

  test('retorna objeto con exactamente las propiedades "text" y "code"', () => {
    const result = getCondition(0);
    expect(Object.keys(result).sort()).toEqual(['code', 'text']);
  });
});

// ─── windDir ─────────────────────────────────────────────────────────────────

describe('windDir(degrees)', () => {
  test('0° → Norte (N)', () => {
    expect(windDir(0)).toBe('N');
  });

  test('360° → Norte (N) — cierre del ciclo', () => {
    expect(windDir(360)).toBe('N');
  });

  test('90° → Este (E)', () => {
    expect(windDir(90)).toBe('E');
  });

  test('180° → Sur (S)', () => {
    expect(windDir(180)).toBe('S');
  });

  test('270° → Oeste (O)', () => {
    expect(windDir(270)).toBe('O');
  });

  test('45° → Noreste (NE)', () => {
    expect(windDir(45)).toBe('NE');
  });

  test('135° → Sureste (SE)', () => {
    expect(windDir(135)).toBe('SE');
  });

  test('225° → Suroeste (SO)', () => {
    expect(windDir(225)).toBe('SO');
  });

  test('315° → Noroeste (NO)', () => {
    expect(windDir(315)).toBe('NO');
  });

  test('22° → NNE (punto compas intermedio)', () => {
    expect(windDir(22)).toBe('NNE');
  });

  test('retorna uno de los 16 valores válidos de la rosa de los vientos', () => {
    const testAngles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    for (const angle of testAngles) {
      expect(WIND_DIRECTIONS).toContain(windDir(angle));
    }
  });

  test('la rosa de los vientos tiene exactamente 16 puntos', () => {
    expect(WIND_DIRECTIONS).toHaveLength(16);
  });
});
