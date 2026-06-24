'use strict';

const { EMERGENCY_KEYWORDS, ALERT_LEVELS, WIND_THRESHOLDS } = require('../config/constants');

/**
 * Scans province weather data for emergency triggers.
 * Three detection strategies run in order per province:
 *   1. Official alert events (WeatherAPI alerts array)
 *   2. Current condition text keyword scan
 *   3. Wind speed threshold (tropical storm / hurricane)
 *
 * @param {Array} provincesData
 * @returns {Array} triggers
 */
function detectFromWeather(provincesData) {
  const triggers = [];

  for (const province of provincesData) {
    // Strategy 1 — official alert events
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
          break; // one keyword per alert is enough
        }
      }
    }

    // Strategy 2 — condition text
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

    // Strategy 3 — wind speed
    const wind = province.current?.wind_kph || 0;
    if (wind >= WIND_THRESHOLDS.HURRICANE_CAT1) {
      triggers.push({
        source:   'WeatherAPI-Wind',
        province: province.name,
        windKph:  wind,
        level:    'Huracán Categoría 1+',
      });
    } else if (wind >= WIND_THRESHOLDS.TROPICAL_STORM) {
      triggers.push({
        source:   'WeatherAPI-Wind',
        province: province.name,
        windKph:  wind,
        level:    'Tormenta Tropical',
      });
    }
  }

  return triggers;
}

/**
 * Converts ONAMET bulletin entries into trigger objects.
 * Only 'emergency' and 'warning' severity entries are included.
 *
 * @param {Array} onaMetAlerts
 * @returns {Array} triggers
 */
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

/**
 * Derives the overall alert level from a merged trigger list.
 * Priority: emergency > warning > watch > normal
 *
 * Emergency condition: any trigger with `level` containing "Huracán"
 *   OR any ONAMET trigger with severity "emergency".
 *
 * @param {Array} triggers
 * @returns {string} ALERT_LEVELS value
 */
function computeAlertLevel(triggers) {
  const hasEmergency = triggers.some(
    t => t.level?.includes('Huracán') || t.severity === 'emergency'
  );
  const hasWarning = triggers.some(t => t.severity === 'warning');
  const hasWatch   = triggers.length > 0;

  if (hasEmergency) return ALERT_LEVELS.EMERGENCY;
  if (hasWarning)   return ALERT_LEVELS.WARNING;
  if (hasWatch)     return ALERT_LEVELS.WATCH;
  return ALERT_LEVELS.NORMAL;
}

module.exports = { detectFromWeather, detectFromOnamet, computeAlertLevel };
