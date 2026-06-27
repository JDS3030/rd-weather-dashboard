'use strict';

const { ALERT_LEVELS }                              = require('../config/constants');
const weatherApiService                             = require('./weatherProviderService');
const onaMetService                                 = require('./onaMetService');
const { detectFromWeather, detectFromOnamet,
        computeAlertLevel }                         = require('./alertDetector');
const { WeatherCache }                              = require('../utils/weatherCache');
const logger                                        = require('../utils/logger');

// Module-level singletons — one cache and one alert state per process
const weatherCache = new WeatherCache();

let currentAlertState = {
  level:       ALERT_LEVELS.NORMAL,
  isEmergency: false,
  triggers:    [],
  activatedAt: null,
  lastChecked: null,
};

// ─── Core update cycle ────────────────────────────────────────────────────────

async function checkAndUpdateAlertStatus() {
  let provincesData;

  try {
    const result = await weatherApiService.getAllProvincesWeather();
    weatherCache.set(result.data);
    provincesData = result.data;
  } catch (err) {
    logger.warn(`Fallo al obtener datos meteorológicos: ${err.message}`);
    if (!weatherCache.hasData()) throw err;
    weatherCache.markStale();
    provincesData = weatherCache.get().data;
  }

  const onaMetData       = await onaMetService.fetchLatestBulletin();
  const weatherTriggers  = detectFromWeather(provincesData);
  const onaMetTriggers   = detectFromOnamet(onaMetData);
  const allTriggers      = [...weatherTriggers, ...onaMetTriggers];

  const level        = computeAlertLevel(allTriggers);
  const wasEmergency = currentAlertState.isEmergency;
  const isEmergency  = level === ALERT_LEVELS.EMERGENCY;

  currentAlertState = {
    level,
    isEmergency,
    triggers:    allTriggers,
    activatedAt: isEmergency && !wasEmergency
      ? new Date().toISOString()
      : isEmergency ? currentAlertState.activatedAt : null,
    lastChecked: new Date().toISOString(),
  };

  if (isEmergency) {
    logger.warn(`🚨 EMERGENCIA ACTIVA — ${allTriggers.length} detonadores detectados`);
  } else {
    logger.info(`Estado: ${level} — Última verificación: ${currentAlertState.lastChecked}`);
  }

  return currentAlertState;
}

// ─── Weather data with caching ────────────────────────────────────────────────

async function getCachedWeatherData() {
  if (!weatherCache.hasData() || weatherCache.isExpired()) {
    try {
      const { data } = await weatherApiService.getAllProvincesWeather();
      weatherCache.set(data);
    } catch (err) {
      logger.warn(`Fallo al actualizar caché: ${err.message}`);
      if (!weatherCache.hasData()) throw err;
      weatherCache.markStale();
    }
  }
  return weatherCache.get();
}

// ─── Read-only accessors ─────────────────────────────────────────────────────

const getAlertState     = () => currentAlertState;
const isEmergencyActive = () => currentAlertState.isEmergency;

function resetState() {
  currentAlertState = {
    level:       ALERT_LEVELS.NORMAL,
    isEmergency: false,
    triggers:    [],
    activatedAt: null,
    lastChecked: null,
  };
  weatherCache._data      = null;
  weatherCache._fetchedAt = null;
  weatherCache._isStale   = false;
}

module.exports = {
  checkAndUpdateAlertStatus,
  getAlertState,
  isEmergencyActive,
  getCachedWeatherData,
  resetState,
};
