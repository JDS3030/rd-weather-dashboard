const axios = require('axios');
const { RD_PROVINCES } = require('../config/constants');
const logger = require('../utils/logger');

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1/forecast';

// WMO weather codes → texto en español + código de icono compatible con WeatherAPI CDN
const WMO_CONDITIONS = {
  0:  { code: 1000, text: 'Despejado' },
  1:  { code: 1003, text: 'Mayormente despejado' },
  2:  { code: 1006, text: 'Parcialmente nublado' },
  3:  { code: 1009, text: 'Cubierto' },
  45: { code: 1030, text: 'Niebla' },
  48: { code: 1135, text: 'Niebla con escarcha' },
  51: { code: 1150, text: 'Llovizna ligera' },
  53: { code: 1153, text: 'Llovizna moderada' },
  55: { code: 1168, text: 'Llovizna intensa' },
  56: { code: 1198, text: 'Llovizna helada ligera' },
  57: { code: 1201, text: 'Llovizna helada intensa' },
  61: { code: 1183, text: 'Lluvia ligera' },
  63: { code: 1189, text: 'Lluvia moderada' },
  65: { code: 1195, text: 'Lluvia intensa' },
  66: { code: 1198, text: 'Lluvia helada ligera' },
  67: { code: 1201, text: 'Lluvia helada intensa' },
  71: { code: 1213, text: 'Nevada ligera' },
  73: { code: 1219, text: 'Nevada moderada' },
  75: { code: 1225, text: 'Nevada intensa' },
  77: { code: 1255, text: 'Granos de nieve' },
  80: { code: 1240, text: 'Chubascos ligeros' },
  81: { code: 1243, text: 'Chubascos moderados' },
  82: { code: 1246, text: 'Chubascos fuertes' },
  85: { code: 1255, text: 'Chubascos de nieve' },
  86: { code: 1258, text: 'Chubascos de nieve intensos' },
  95: { code: 1273, text: 'Tormenta eléctrica' },
  96: { code: 1279, text: 'Tormenta con granizo' },
  99: { code: 1282, text: 'Tormenta con granizo fuerte' },
};

function wmoCondition(code) {
  const c = WMO_CONDITIONS[code] ?? { code: 1000, text: 'Variable' };
  return {
    text: c.text,
    code: c.code,
    icon: `https://cdn.weatherapi.com/weather/64x64/day/${c.code}.png`,
  };
}

function degreesToCardinal(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

async function getProvinceWeather(province) {
  const response = await axios.get(OPEN_METEO_BASE, {
    params: {
      latitude:  province.lat,
      longitude: province.lon,
      current: [
        'temperature_2m', 'apparent_temperature', 'relative_humidity_2m',
        'wind_speed_10m', 'wind_direction_10m', 'surface_pressure',
        'visibility', 'uv_index', 'precipitation', 'cloud_cover',
        'weather_code',
      ].join(','),
      daily: [
        'weather_code', 'temperature_2m_max', 'temperature_2m_min',
        'precipitation_probability_max', 'precipitation_sum', 'wind_speed_10m_max',
      ].join(','),
      forecast_days:   3,
      wind_speed_unit: 'kmh',
      timezone:        'America/Santo_Domingo',
    },
    timeout: 12000,
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
      wind_dir:    degreesToCardinal(c.wind_direction_10m),
      pressure_mb: c.surface_pressure,
      vis_km:      Math.round(c.visibility / 100) / 10,
      uv:          c.uv_index,
      precip_mm:   c.precipitation,
      cloud:       c.cloud_cover,
      condition:   wmoCondition(c.weather_code),
    },
    forecast: daily.time.map((date, i) => ({
      date,
      maxtemp_c:            daily.temperature_2m_max[i],
      mintemp_c:            daily.temperature_2m_min[i],
      avgtemp_c:            Math.round((daily.temperature_2m_max[i] + daily.temperature_2m_min[i]) / 2 * 10) / 10,
      daily_chance_of_rain: daily.precipitation_probability_max[i] ?? 0,
      totalprecip_mm:       daily.precipitation_sum[i],
      maxwind_kph:          daily.wind_speed_10m_max[i],
      condition:            wmoCondition(daily.weather_code[i]),
    })),
    alerts:      [],
    lastUpdated: new Date().toISOString(),
  };
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function getAllProvincesWeather() {
  const data   = [];
  const errors = [];

  for (let i = 0; i < RD_PROVINCES.length; i++) {
    if (i > 0) await delay(300);
    try {
      const result = await getProvinceWeather(RD_PROVINCES[i]);
      data.push(result);
    } catch (err) {
      errors.push({ province: RD_PROVINCES[i].name, error: err.message });
      logger.error(`Open-Meteo failed for ${RD_PROVINCES[i].name}: ${err.message}`);
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
