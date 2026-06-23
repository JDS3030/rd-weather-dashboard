const axios = require('axios');
const { RD_PROVINCES } = require('../config/constants');
const logger = require('../utils/logger');

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// WMO Weather codes → español
const WMO = {
  0:  { text: 'Despejado',                    code: 1000 },
  1:  { text: 'Principalmente despejado',      code: 1003 },
  2:  { text: 'Parcialmente nublado',          code: 1003 },
  3:  { text: 'Nublado',                       code: 1006 },
  45: { text: 'Neblina',                       code: 1030 },
  48: { text: 'Niebla con escarcha',           code: 1030 },
  51: { text: 'Llovizna ligera',               code: 1153 },
  53: { text: 'Llovizna moderada',             code: 1153 },
  55: { text: 'Llovizna intensa',              code: 1180 },
  61: { text: 'Lluvia ligera',                 code: 1180 },
  63: { text: 'Lluvia moderada',               code: 1189 },
  65: { text: 'Lluvia intensa',                code: 1195 },
  71: { text: 'Nevada ligera',                 code: 1210 },
  73: { text: 'Nevada moderada',               code: 1213 },
  75: { text: 'Nevada intensa',                code: 1216 },
  77: { text: 'Granizo',                       code: 1237 },
  80: { text: 'Chubascos ligeros',             code: 1180 },
  81: { text: 'Chubascos moderados',           code: 1189 },
  82: { text: 'Chubascos intensos',            code: 1195 },
  85: { text: 'Nevadas ligeras',               code: 1255 },
  86: { text: 'Nevadas intensas',              code: 1258 },
  95: { text: 'Tormenta eléctrica',            code: 1273 },
  96: { text: 'Tormenta con granizo',          code: 1279 },
  99: { text: 'Tormenta con granizo intenso',  code: 1282 },
};

function getCondition(wmoCode) {
  return WMO[wmoCode] ?? { text: 'Variable', code: 1000 };
}

function windDir(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSO','SO','OSO','O','ONO','NO','NNO'];
  return dirs[Math.round(deg / 22.5) % 16];
}

async function getProvinceWeather(province) {
  const response = await axios.get(BASE_URL, {
    params: {
      latitude:  province.lat,
      longitude: province.lon,
      current: [
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
      ].join(','),
      daily: [
        'weather_code',
        'temperature_2m_max',
        'temperature_2m_min',
        'precipitation_sum',
        'precipitation_probability_max',
        'wind_speed_10m_max',
      ].join(','),
      wind_speed_unit: 'kmh',
      timezone:        'America/Santo_Domingo',
      forecast_days:   3,
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

async function getAllProvincesWeather() {
  const results = await Promise.allSettled(
    RD_PROVINCES.map(p => getProvinceWeather(p))
  );

  const data   = [];
  const errors = [];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      data.push(r.value);
    } else {
      errors.push({ province: RD_PROVINCES[i].name, error: r.reason.message });
      logger.error(`Open-Meteo fallo para ${RD_PROVINCES[i].name}: ${r.reason.message}`);
    }
  });

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
