'use strict';

const alertService  = require('./alertService');
const onaMetService = require('./onaMetService');
const logger        = require('../utils/logger');

let reports    = [];
const MAX_KEEP = 48;

// ─── Weather summary builder ──────────────────────────────────────────────────

/**
 * Builds a multi-line plain-text weather summary suitable for WhatsApp/SMS.
 * Returns a safe fallback when provincesData is empty or null.
 *
 * @param {Array} provincesData
 * @returns {string}
 */
function buildWeatherSummary(provincesData) {
  if (!provincesData?.length) return 'Sin datos disponibles.';

  const temps      = provincesData.map(p => p.current?.temp_c).filter(Number.isFinite);
  const winds      = provincesData.map(p => p.current?.wind_kph || 0);
  const avgTemp    = temps.length
    ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
    : 'N/D';
  const maxWind     = Math.max(...winds);
  const maxWindProv = provincesData[winds.indexOf(maxWind)]?.name || 'N/D';

  const rainy = provincesData.filter(p =>
    (p.current?.precip_mm || 0) > 0 ||
    p.current?.condition?.text?.toLowerCase().includes('lluvi')
  );

  const lines = provincesData.map(p =>
    `  • ${p.name.padEnd(28)} ${(p.current?.temp_c ?? '--').toString().padStart(4)}°C  ` +
    `${(p.current?.condition?.text || '').substring(0, 28).padEnd(28)}  ` +
    `Viento: ${(p.current?.wind_kph ?? 0).toFixed(0)} km/h`
  ).join('\n');

  return `
📊 RESUMEN METEOROLÓGICO — REPÚBLICA DOMINICANA
════════════════════════════════════════════════
🌡️  Temperatura promedio: ${avgTemp}°C
🌡️  Máx: ${Math.max(...temps).toFixed(1)}°C  |  Mín: ${Math.min(...temps).toFixed(1)}°C
💨  Viento máximo: ${maxWind.toFixed(0)} km/h en ${maxWindProv}
🌧️  Provincias con lluvia: ${rainy.length > 0 ? rainy.map(p => p.name).join(', ') : 'Ninguna'}
📍  Provincias monitoreadas: ${provincesData.length}

ESTADO POR PROVINCIA:
${lines}
`.trim();
}

// ─── Report generators ────────────────────────────────────────────────────────

async function generateDailyReport() {
  const { data: provincesData } = await alertService.getCachedWeatherData();
  const alertState = alertService.getAlertState();
  const onaMetData = onaMetService.getAlerts();

  const report = {
    id:           `daily-${Date.now()}`,
    type:         'daily',
    generatedAt:  new Date().toISOString(),
    alertLevel:   alertState.level,
    summary:      buildWeatherSummary(provincesData),
    onaMetAlerts: onaMetData.alerts,
    triggers:     alertState.triggers,
    provincesData,
  };

  reports.unshift(report);
  if (reports.length > MAX_KEEP) reports = reports.slice(0, MAX_KEEP);
  logger.info(`Reporte diario generado: ${report.id}`);
  return report;
}

async function generateEmergencyReport() {
  const { data: provincesData } = await alertService.getCachedWeatherData();
  const alertState = alertService.getAlertState();
  const onaMetData = onaMetService.getAlerts();

  const triggerLines = alertState.triggers.map(t => {
    if (t.source === 'ONAMET')       return `🏛  ONAMET: ${t.title}`;
    if (t.source.includes('Wind'))   return `💨  Viento peligroso en ${t.province}: ${t.windKph} km/h (${t.level})`;
    return `⚠️  ${t.source} — ${t.province}: ${t.alertText || t.conditionText || t.keyword}`;
  }).join('\n') || 'Monitoreo activo continuo';

  const summary = `
🚨 REPORTE DE EMERGENCIA METEOROLÓGICA
═══════════════════════════════════════
NIVEL:     ${alertState.level.toUpperCase()}
Activado:  ${alertState.activatedAt || 'N/D'}
Generado:  ${new Date().toLocaleString('es-DO')}

ALERTAS ACTIVAS:
${triggerLines}

${buildWeatherSummary(provincesData)}
`.trim();

  const report = {
    id:           `emergency-${Date.now()}`,
    type:         'emergency',
    generatedAt:  new Date().toISOString(),
    alertLevel:   alertState.level,
    summary,
    onaMetAlerts: onaMetData.alerts,
    triggers:     alertState.triggers,
    provincesData,
  };

  reports.unshift(report);
  if (reports.length > MAX_KEEP) reports = reports.slice(0, MAX_KEEP);
  logger.warn(`Reporte de emergencia generado: ${report.id}`);
  return report;
}

// ─── Accessors ────────────────────────────────────────────────────────────────

const getLatestReport = ()           => reports[0] || null;
const getReports      = (limit = 10) => reports.slice(0, limit);

module.exports = {
  buildWeatherSummary,
  generateDailyReport,
  generateEmergencyReport,
  getLatestReport,
  getReports,
};
