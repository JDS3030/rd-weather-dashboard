const logger = require('../utils/logger');

// ─── Estado interno de alertas ONAMET ────────────────────────────────────────
// En producción esto sería un scraper de https://onamet.gob.do/
let onaMetAlerts = [];
let lastBulletinTime = null;

// Simula la lectura del boletín más reciente de ONAMET
function buildSimulatedAlerts() {
  if (process.env.ONAMET_SIMULATE_EMERGENCY === 'true') {
    return [
      {
        id:              `ONAMET-EMG-${Date.now()}`,
        title:           'AVISO ESPECIAL Nº 1: TORMENTA TROPICAL ACTIVA',
        description:     'ONAMET emite aviso especial por tormenta tropical con vientos sostenidos de 95 km/h que se aproxima al territorio nacional. Se esperan lluvias intensas, marejadas y vientos fuertes en las próximas 24 horas.',
        type:            'tropical_storm',
        severity:        'emergency',
        affectedRegions: ['Norte', 'Nordeste', 'Sur', 'Este'],
        issuedAt:        new Date().toISOString(),
        source:          'ONAMET',
      },
    ];
  }

  if (process.env.ONAMET_SIMULATE_WATCH === 'true') {
    return [
      {
        id:              `ONAMET-WATCH-${Date.now()}`,
        title:           'VIGILANCIA METEOROLÓGICA: Sistema de Baja Presión',
        description:     'ONAMET mantiene vigilancia sobre sistema de baja presión organizado en el Mar Caribe. Se prevén lluvias moderadas a fuertes en las próximas 48 horas.',
        type:            'watch',
        severity:        'watch',
        affectedRegions: ['Sur', 'Este'],
        issuedAt:        new Date().toISOString(),
        source:          'ONAMET',
      },
    ];
  }

  return [];
}

async function fetchLatestBulletin() {
  logger.info('Consultando boletín ONAMET...');
  // En producción: await scrapeOnaMetWebsite()
  onaMetAlerts   = buildSimulatedAlerts();
  lastBulletinTime = new Date().toISOString();
  return onaMetAlerts;
}

function getAlerts() {
  return {
    alerts:      onaMetAlerts,
    lastUpdated: lastBulletinTime,
    source:      'ONAMET — Oficina Nacional de Meteorología, República Dominicana',
  };
}

// Endpoint admin: inyectar alerta manual
function setManualAlert(alertData) {
  onaMetAlerts     = [alertData];
  lastBulletinTime = new Date().toISOString();
  logger.warn(`Alerta manual ONAMET establecida: ${alertData.title}`);
}

function clearAlerts() {
  onaMetAlerts     = [];
  lastBulletinTime = new Date().toISOString();
  logger.info('Alertas ONAMET limpiadas');
}

module.exports = { fetchLatestBulletin, getAlerts, setManualAlert, clearAlerts };
