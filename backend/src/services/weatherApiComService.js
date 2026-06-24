'use strict';

const axios            = require('axios');
const { RD_PROVINCES } = require('../config/constants');
const logger           = require('../utils/logger');

// WeatherAPI.com — usa /forecast.json para obtener datos actuales + pronóstico en una sola llamada
const BASE_URL        = 'http://api.weatherapi.com/v1/forecast.json';
const REQUEST_TIMEOUT = 10_000;
const REQUEST_DELAY   = 200; // ms entre provincias

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ─── Construir objeto de provincia desde respuesta de WeatherAPI ──────────────

function buildProvinceData(province, data) {
  const c = data.current;

  const forecast = (data.forecast?.forecastday || []).map(day => ({
    date:                 day.date,
    maxtemp_c:            day.day.maxtemp_c,
    mintemp_c:            day.day.mintemp_c,
    avgtemp_c:            day.day.avgtemp_c,
    daily_chance_of_rain: day.day.daily_chance_of_rain,
    totalprecip_mm:       day.day.totalprecip_mm,
    maxwind_kph:          day.day.maxwind_kph,
    condition: {
      text: day.day.condition.text,
      code: day.day.condition.code,
      icon: `https:${day.day.condition.icon}`,
    },
  }));

  return {
    id:     province.id,
    name:   province.name,
    region: province.region,
    lat:    province.lat,
    lon:    province.lon,
    current: {
      temp_c:      c.temp_c,
      feelslike_c: c.feelslike_c,
      humidity:    c.humidity,
      wind_kph:    c.wind_kph,
      wind_dir:    c.wind_dir,
      pressure_mb: c.pressure_mb,
      vis_km:      c.vis_km,
      uv:          c.uv,
      precip_mm:   c.precip_mm,
      cloud:       c.cloud,
      condition: {
        text: c.condition.text,
        code: c.condition.code,
        icon: `https:${c.condition.icon}`,
      },
    },
    forecast,
    alerts:      data.alerts?.alert || [],
    lastUpdated: c.last_updated,
    source:      'WeatherAPI.com',
  };
}

// ─── Provincia individual ─────────────────────────────────────────────────────

async function getProvinceWeather(province) {
  const apiKey = process.env.WEATHERAPI_KEY;
  if (!apiKey) throw new Error('WEATHERAPI_KEY no está configurada en las variables de entorno');

  const response = await axios.get(BASE_URL, {
    params: {
      key:   apiKey,
      q:     province.query,
      days:  3,
      lang:  'es',
      aqi:   'no',
    },
    timeout: REQUEST_TIMEOUT,
  });

  return buildProvinceData(province, response.data);
}

// ─── Todas las provincias ─────────────────────────────────────────────────────

async function getAllProvincesWeather() {
  const apiKey = process.env.WEATHERAPI_KEY;
  if (!apiKey) throw new Error('WEATHERAPI_KEY no está configurada en las variables de entorno');

  const data   = [];
  const errors = [];

  for (let i = 0; i < RD_PROVINCES.length; i++) {
    if (i > 0) await delay(REQUEST_DELAY);
    const province = RD_PROVINCES[i];

    try {
      data.push(await getProvinceWeather(province));
    } catch (err) {
      errors.push({ id: province.id, province: province.name, error: err.message });
      logger.error(`[WeatherAPI] Falló para "${province.name}": ${err.message}`);
    }
  }

  if (data.length === 0) {
    const firstError = errors[0]?.error ?? 'sin respuesta';
    throw new Error(`WeatherAPI no devolvió datos para ninguna provincia. Causa: ${firstError}`);
  }

  return { data, errors };
}

// ─── Provincia individual por ID ──────────────────────────────────────────────

async function getSingleProvinceWeather(provinceId) {
  const apiKey = process.env.WEATHERAPI_KEY;
  if (!apiKey) throw new Error('WEATHERAPI_KEY no está configurada en las variables de entorno');

  const province = RD_PROVINCES.find(p => p.id === provinceId);
  if (!province) {
    const err = new Error(`Provincia '${provinceId}' no encontrada`);
    err.status = 404;
    throw err;
  }

  return getProvinceWeather(province);
}

module.exports = { getAllProvincesWeather, getSingleProvinceWeather };
