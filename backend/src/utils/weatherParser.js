'use strict';

const WMO_CODES = {
  0:  { text: 'Despejado',                     code: 1000 },
  1:  { text: 'Principalmente despejado',       code: 1003 },
  2:  { text: 'Parcialmente nublado',           code: 1003 },
  3:  { text: 'Nublado',                        code: 1006 },
  45: { text: 'Neblina',                        code: 1030 },
  48: { text: 'Niebla con escarcha',            code: 1030 },
  51: { text: 'Llovizna ligera',                code: 1153 },
  53: { text: 'Llovizna moderada',              code: 1153 },
  55: { text: 'Llovizna intensa',               code: 1180 },
  61: { text: 'Lluvia ligera',                  code: 1180 },
  63: { text: 'Lluvia moderada',                code: 1189 },
  65: { text: 'Lluvia intensa',                 code: 1195 },
  71: { text: 'Nevada ligera',                  code: 1210 },
  73: { text: 'Nevada moderada',                code: 1213 },
  75: { text: 'Nevada intensa',                 code: 1216 },
  77: { text: 'Granizo',                        code: 1237 },
  80: { text: 'Chubascos ligeros',              code: 1180 },
  81: { text: 'Chubascos moderados',            code: 1189 },
  82: { text: 'Chubascos intensos',             code: 1195 },
  85: { text: 'Nevadas ligeras',                code: 1255 },
  86: { text: 'Nevadas intensas',               code: 1258 },
  95: { text: 'Tormenta eléctrica',             code: 1273 },
  96: { text: 'Tormenta con granizo',           code: 1279 },
  99: { text: 'Tormenta con granizo intenso',   code: 1282 },
};

const WIND_DIRECTIONS = [
  'N','NNE','NE','ENE','E','ESE','SE','SSE',
  'S','SSO','SO','OSO','O','ONO','NO','NNO',
];

/**
 * Maps a WMO weather code to a condition descriptor object.
 * Falls back to { text: 'Variable', code: 1000 } for unknown codes.
 */
function getCondition(wmoCode) {
  return WMO_CODES[wmoCode] ?? { text: 'Variable', code: 1000 };
}

/**
 * Converts wind direction in degrees (0–360) to a compass abbreviation.
 * Uses 16-point compass rose with 22.5° segments.
 */
function windDir(deg) {
  const index = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return WIND_DIRECTIONS[index];
}

module.exports = { WMO_CODES, WIND_DIRECTIONS, getCondition, windDir };
