'use strict';

const axios                      = require('axios');
const { RD_PROVINCES }           = require('../config/constants');
const { getCondition, windDir }  = require('../utils/weatherParser');
const logger                     = require('../utils/logger');

const BASE_URL        = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT = 12_000;
const REQUEST_DELAY   = 300; // ms between province requests to stay within API rate limits

const CURRENT_FIELDS = [
  'temperature_2m',
  'relative_humidity_2m',
  'apparent_temperature',
  'precipitation',
  'weather_code',
  'cloud_cover',
  'pressure_msl',
  'wind_speed_10m',
  'wind_direction_10m',
  'uv_index',
  'visibility',
].join(',');

const DAILY_FIELDS = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'precipitation_probability_max',
  'wind_speed_10m_max',
].join(',');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ─── Single province ──────────────────────────────────────────────────────────

async function getProvinceWeather(province) {
  const response = await axios.get(BASE_URL, {
    params: {
      latitude:        province.lat,
      longitude:       province.lon,
      current:         CURRENT_FIELDS,
      daily:           DAILY_FIELDS,
      wind_speed_unit: 'kmh',
      timezone:        'America/Santo_Domingo',
      forecast_days:   3,
    },
    timeout: REQUEST_TIMEOUT,
  });

  const c     = response.data.current;
  const daily = response.data.daily;

  return {
    id:     province.id,
    name:   province.name,
    region: province.region,
    lat:    province.lat,
    lon:    province.lon,
    current: {
      temp_c:      c.temperature_2m,
      feelslike_c: c.apparent_temperature,
      humidity:    c.relative_humidity_2m,
      wind_kph:    c.wind_speed_10m,
      wind_dir:    windDir(c.wind_direction_10m),
      pressure_mb: c.pressure_msl,
      vis_km:      c.visibility != null ? +(c.visibility / 1000).toFixed(1) : null,
      uv:          c.uv_index,
      precip_mm:   c.precipitation,
      cloud:       c.cloud_cover,
      condition:   getCondition(c.weather_code),
    },
    forecast: (daily.time || []).map((date, i) => ({
      date,
      maxtemp_c:            daily.temperature_2m_max[i],
      mintemp_c:            daily.temperature_2m_min[i],
      avgtemp_c:            +((daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2).toFixed(1),
      daily_chance_of_rain: daily.precipitation_probability_max[i],
      totalprecip_mm:       daily.precipitation_sum[i],
      maxwind_kph:          daily.wind_speed_10m_max[i],
      condition:            getCondition(daily.weather_code[i]),
    })),
    alerts:      [],
    lastUpdated: new Date().toISOString(),
    source:      'Open-Meteo · GFS/ECMWF',
  };
}

// ─── All provinces ────────────────────────────────────────────────────────────

async function getAllProvincesWeather() {
  const data   = [];
  const errors = [];

  for (let i = 0; i < RD_PROVINCES.length; i++) {
    if (i > 0) await delay(REQUEST_DELAY);
    try {
      data.push(await getProvinceWeather(RD_PROVINCES[i]));
    } catch (err) {
      errors.push({ province: RD_PROVINCES[i].name, error: err.message });
      logger.error(`Open-Meteo falló para ${RD_PROVINCES[i].name}: ${err.message}`);
    }
  }

  return { data, errors };
}

async function getSingleProvinceWeather(provinceId) {
  const province = RD_PROVINCES.find(p => p.id === provinceId);
  if (!province) {
    const err = new Error(`Provincia '${provinceId}' no encontrada`);
    err.status = 404;
    throw err;
  }
  return getProvinceWeather(province);
}

module.exports = { getAllProvincesWeather, getSingleProvinceWeather };
