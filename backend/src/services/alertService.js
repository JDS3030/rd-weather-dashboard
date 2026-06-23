const { EMERGENCY_KEYWORDS, ALERT_LEVELS, WIND_THRESHOLDS } = require('../config/constants');
const weatherApiService = require('./openMeteoService');
const onaMetService     = require('./onaMetService');
const logger            = require('../utils/logger');

// ─── Estado global de alerta ──────────────────────────────────────────────────
let currentAlertState = {
  level:       ALERT_LEVELS.NORMAL,
  isEmergency: false,
  triggers:    [],
  activatedAt: null,
  lastChecked: null,
};

// Cache de datos meteorológicos (5 minutos)
let cachedWeatherData = null;
let lastWeatherFetch  = null;
let isStaleData       = false;
const CACHE_TTL       = 5 * 60 * 1000;

// ─── Lógica de detección ──────────────────────────────────────────────────────

function detectFromWeather(provincesData) {
  const triggers = [];

  for (const province of provincesData) {
    // 1. Alertas oficiales de WeatherAPI
    for (const alert of (province.alerts || [])) {
      const text = `${alert.event || ''} ${alert.desc || ''}`.toLowerCase();
      for (const kw of EMERGENCY_KEYWORDS) {
        if (text.includes(kw.toLowerCase())) {
          triggers.push({
            source:    'WeatherAPI-Alert',
            province:  province.name,
            keyword:   kw,
            alertText: alert.event || alert.desc,
          });
          break;
        }
      }
    }

    // 2. Texto de condición actual
    const condText = (province.current?.condition?.text || '').toLowerCase();
    for (const kw of EMERGENCY_KEYWORDS) {
      if (condText.includes(kw.toLowerCase())) {
        triggers.push({
          source:        'WeatherAPI-Condition',
          province:      province.name,
          keyword:       kw,
          conditionText: province.current.condition.text,
        });
        break;
      }
    }

    // 3. Umbral de velocidad del viento
    const wind = province.current?.wind_kph || 0;
    if (wind >= WIND_THRESHOLDS.HURRICANE_CAT1) {
      triggers.push({ source: 'WeatherAPI-Wind', province: province.name, windKph: wind, level: 'Huracán Categoría 1+' });
    } else if (wind >= WIND_THRESHOLDS.TROPICAL_STORM) {
      triggers.push({ source: 'WeatherAPI-Wind', province: province.name, windKph: wind, level: 'Tormenta Tropical' });
    }
  }

  return triggers;
}

function detectFromOnamet(onaMetAlerts) {
  return onaMetAlerts
    .filter(a => a.severity === 'emergency' || a.severity === 'warning')
    .map(a => ({
      source:      'ONAMET',
      title:       a.title,
      description: a.description,
      type:        a.type,
      severity:    a.severity,
    }));
}

// ─── Función principal ────────────────────────────────────────────────────────

async function checkAndUpdateAlertStatus() {
  let provincesData;
  try {
    const result = await weatherApiService.getAllProvincesWeather();
    provincesData    = result.data;
    cachedWeatherData = provincesData;
    lastWeatherFetch  = Date.now();
    isStaleData       = false;
  } catch (err) {
    logger.warn(`Fallo al obtener datos meteorológicos: ${err.message}`);
    if (!cachedWeatherData) throw err;
    provincesData = cachedWeatherData;
    isStaleData   = true;
  }

  const onaMetData     = await onaMetService.fetchLatestBulletin();
  const weatherTriggers = detectFromWeather(provincesData);
  const onaMetTriggers  = detectFromOnamet(onaMetData);
  const allTriggers     = [...weatherTriggers, ...onaMetTriggers];

  const hasEmergency = allTriggers.some(
    t => t.severity === 'emergency' ||
         t.level?.includes('Huracán') ||
         (t.source === 'ONAMET' && t.severity === 'emergency')
  );
  const hasWarning   = allTriggers.some(t => t.severity === 'warning');
  const hasWatch     = allTriggers.length > 0;

  let level = ALERT_LEVELS.NORMAL;
  if (hasEmergency) level = ALERT_LEVELS.EMERGENCY;
  else if (hasWarning) level = ALERT_LEVELS.WARNING;
  else if (hasWatch)   level = ALERT_LEVELS.WATCH;

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

  if (isEmergency) logger.warn(`🚨 EMERGENCIA ACTIVA — ${allTriggers.length} detonadores detectados`);
  else logger.info(`Estado: ${level} — Última verificación: ${currentAlertState.lastChecked}`);

  return currentAlertState;
}

async function getCachedWeatherData() {
  if (!cachedWeatherData || !lastWeatherFetch || Date.now() - lastWeatherFetch > CACHE_TTL) {
    try {
      const { data } = await weatherApiService.getAllProvincesWeather();
      cachedWeatherData = data;
      lastWeatherFetch  = Date.now();
      isStaleData       = false;
    } catch (err) {
      logger.warn(`Fallo al actualizar caché: ${err.message}`);
      if (!cachedWeatherData) throw err;
      isStaleData = true;
    }
  }
  return {
    data:      cachedWeatherData,
    isStale:   isStaleData,
    staleFrom: isStaleData ? new Date(lastWeatherFetch).toISOString() : null,
  };
}

const getAlertState      = () => currentAlertState;
const isEmergencyActive  = () => currentAlertState.isEmergency;

module.exports = { checkAndUpdateAlertStatus, getAlertState, isEmergencyActive, getCachedWeatherData };
