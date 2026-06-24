'use strict';

const axios           = require('axios');
const { RD_PROVINCES } = require('../config/constants');
const { windDir }     = require('../utils/weatherParser');
const logger          = require('../utils/logger');

const BASE_URL        = 'https://api.openweathermap.org/data/2.5/weather';
const REQUEST_TIMEOUT = 10_000;
const REQUEST_DELAY   = 300; // ms entre provincias para no saturar la API

// Mapeo de códigos OpenWeather → códigos WeatherAPI.com (compatibilidad con el frontend)
const OW_TO_WEATHERAPI_CODE = {
  // Tormenta eléctrica
  200: 1273, 201: 1273, 202: 1282, 210: 1273, 211: 1273,
  212: 1282, 221: 1273, 230: 1273, 231: 1273, 232: 1273,
  // Llovizna
  300: 1153, 301: 1153, 302: 1180, 310: 1153, 311: 1153,
  312: 1180, 313: 1189, 314: 1195, 321: 1153,
  // Lluvia
  500: 1180, 501: 1189, 502: 1195, 503: 1195, 504: 1195,
  511: 1198, 520: 1180, 521: 1189, 522: 1195, 531: 1189,
  // Nieve
  600: 1210, 601: 1213, 602: 1216, 611: 1237, 612: 1255,
  613: 1255, 615: 1255, 616: 1255, 620: 1255, 621: 1258, 622: 1258,
  // Atmósfera (neblina, polvo, etc.)
  701: 1030, 711: 1030, 721: 1030, 731: 1030, 741: 1030,
  751: 1030, 761: 1030, 762: 1030, 771: 1273, 781: 1273,
  // Despejado
  800: 1000,
  // Nubes
  801: 1003, 802: 1006, 803: 1006, 804: 1009,
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ─── Construir objeto de provincia desde respuesta de OpenWeather ─────────────

function buildProvinceData(province, raw) {
  const weatherEntry = raw.weather[0];

  return {
    id:     province.id,
    name:   province.name,
    region: province.region,
    lat:    province.lat,
    lon:    province.lon,
    current: {
      temp_c:      raw.main.temp,
      feelslike_c: raw.main.feels_like,
      humidity:    raw.main.humidity,
      wind_kph:    +(raw.wind.speed * 3.6).toFixed(1), // m/s → km/h
      wind_dir:    windDir(raw.wind.deg ?? 0),
      pressure_mb: raw.main.pressure,
      vis_km:      raw.visibility != null ? +(raw.visibility / 1000).toFixed(1) : null,
      uv:          null, // requiere plan pago en OpenWeather
      precip_mm:   raw.rain?.['1h'] ?? raw.rain?.['3h'] ?? 0,
      cloud:       raw.clouds?.all ?? 0,
      condition: {
        text: weatherEntry.description,
        code: OW_TO_WEATHERAPI_CODE[weatherEntry.id] ?? 1000,
        icon: `https://openweathermap.org/img/wn/${weatherEntry.icon}@2x.png`,
      },
    },
    forecast:    [], // El endpoint /weather no incluye pronóstico; usar /forecast para eso
    alerts:      [],
    lastUpdated: new Date(raw.dt * 1000).toISOString(),
    source:      'OpenWeather API',
  };
}

// ─── Provincia individual ─────────────────────────────────────────────────────

async function getProvinceWeather(province) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY no está configurada en las variables de entorno');

  const response = await axios.get(BASE_URL, {
    params: {
      q:     province.query,
      appid: apiKey,
      units: 'metric',
      lang:  'es',
    },
    timeout: REQUEST_TIMEOUT,
  });

  const raw = response.data;

  // OpenWeather devuelve cod:200 en éxito; otros valores indican error
  if (raw.cod !== 200) {
    throw new Error(`OpenWeather respondió con código ${raw.cod}: ${raw.message ?? 'error desconocido'}`);
  }

  return buildProvinceData(province, raw);
}

// ─── Todas las provincias ─────────────────────────────────────────────────────

async function getAllProvincesWeather() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY no está configurada en las variables de entorno');

  const data   = [];
  const errors = [];

  for (let i = 0; i < RD_PROVINCES.length; i++) {
    if (i > 0) await delay(REQUEST_DELAY);
    const province = RD_PROVINCES[i];

    try {
      data.push(await getProvinceWeather(province));
    } catch (err) {
      errors.push({ id: province.id, province: province.name, error: err.message });
      logger.error(`[OpenWeather] Falló para "${province.name}": ${err.message}`);
    }
  }

  // Si ninguna provincia respondió, lanzar error para activar el fallback completo
  if (data.length === 0) {
    const firstError = errors[0]?.error ?? 'sin respuesta';
    throw new Error(`OpenWeather no devolvió datos para ninguna provincia. Causa: ${firstError}`);
  }

  return { data, errors };
}

// ─── Provincia individual por ID ──────────────────────────────────────────────

async function getSingleProvinceWeather(provinceId) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY no está configurada en las variables de entorno');

  const province = RD_PROVINCES.find(p => p.id === provinceId);
  if (!province) {
    const err = new Error(`Provincia '${provinceId}' no encontrada`);
    err.status = 404;
    throw err;
  }

  return getProvinceWeather(province);
}

module.exports = { getAllProvincesWeather, getSingleProvinceWeather };
