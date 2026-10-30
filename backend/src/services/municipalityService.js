'use strict';

const axios                     = require('axios');
const { RD_MUNICIPALITIES }     = require('../config/municipalities');
const { getCondition, windDir } = require('../utils/weatherParser');
const logger                    = require('../utils/logger');

const BASE_URL        = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT = 12_000;
const CACHE_TTL_MS    = 15 * 60 * 1000; // 15 min

const CURRENT_FIELDS = [
  'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
  'precipitation', 'weather_code', 'cloud_cover', 'pressure_msl',
  'wind_speed_10m', 'wind_direction_10m', 'uv_index', 'visibility',
].join(',');

// Cache por provincia: Map<provinceId, { data, cachedAt }>
const cache = new Map();

function isFresh(provinceId) {
  const entry = cache.get(provinceId);
  return entry && (Date.now() - entry.cachedAt) < CACHE_TTL_MS;
}

async function fetchOne(mun) {
  const res = await axios.get(BASE_URL, {
    params: {
      latitude:        mun.lat,
      longitude:       mun.lon,
      current:         CURRENT_FIELDS,
      wind_speed_unit: 'kmh',
      timezone:        'America/Santo_Domingo',
    },
    timeout: REQUEST_TIMEOUT,
  });
  const c = res.data.current;
  return {
    id:         mun.id,
    name:       mun.name,
    provinceId: mun.provinceId,
    lat:        mun.lat,
    lon:        mun.lon,
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
    lastUpdated: new Date().toISOString(),
    source:      'Open-Meteo · GFS/ECMWF',
  };
}

async function getMunicipalitiesForProvince(provinceId) {
  if (isFresh(provinceId)) return cache.get(provinceId).data;

  const list = RD_MUNICIPALITIES.filter(m => m.provinceId === provinceId);
  if (!list.length) {
    const err = new Error(`Sin municipios registrados para '${provinceId}'`);
    err.status = 404;
    throw err;
  }

  const settled = await Promise.allSettled(list.map(m => fetchOne(m)));
  const data = settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    logger.warn(`[MUNICIPALITY] Fallo ${list[i].name}: ${r.reason?.message}`);
    return { ...list[i], current: null, error: r.reason?.message };
  });

  cache.set(provinceId, { data, cachedAt: Date.now() });
  return data;
}

async function getAllMunicipalitiesWeather() {
  const provinceIds = [...new Set(RD_MUNICIPALITIES.map(m => m.provinceId))];
  const settled = await Promise.allSettled(
    provinceIds.map(id => getMunicipalitiesForProvince(id))
  );
  return settled
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);
}

function getAllMunicipalitiesMeta() {
  return RD_MUNICIPALITIES.map(({ id, name, provinceId, lat, lon }) => ({
    id, name, provinceId, lat, lon,
  }));
}

module.exports = { getMunicipalitiesForProvince, getAllMunicipalitiesWeather, getAllMunicipalitiesMeta };
