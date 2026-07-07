'use strict';

const axios   = require('axios');
const cheerio = require('cheerio');
const logger  = require('../utils/logger');

// ─── URLs del sitio ONAMET (se intentan en orden) ────────────────────────────
const ONAMET_URLS = [
  'https://onamet.gob.do/',
  'https://onamet.gob.do/index.php/avisos-y-alertas',
  'https://onamet.gob.do/index.php/boletines-especiales',
];

const REQUEST_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (NubeVigia-RD/1.4.1; +https://github.com/JDS3030/rd-weather-dashboard)',
  'Accept':     'text/html,application/xhtml+xml',
};

// ─── Palabras clave por nivel de severidad ────────────────────────────────────
const SEVERITY_KEYWORDS = {
  emergency: ['huracán', 'huracan', 'hurricane', 'emergencia nacional', 'aviso especial', 'categoría 1', 'categoria 1'],
  warning:   ['tormenta tropical', 'tropical storm', 'aviso', 'alerta roja', 'vientos fuertes'],
  watch:     ['vigilancia', 'watch', 'depresión tropical', 'depresion tropical', 'baja presión', 'baja presion', 'alerta amarilla'],
};

// ─── Regiones mencionadas en boletines ───────────────────────────────────────
const REGION_KEYS = {
  'norte':      'Norte',
  'nordeste':   'Nordeste',
  'noroeste':   'Noroeste',
  'sur':        'Sur',
  'este':       'Este',
  'suroeste':   'Suroeste',
  'cibao':      'Cibao',
  'enriquillo': 'Enriquillo',
  'yuma':       'Yuma',
  'valdesia':   'Valdesia',
  'ozama':      'Ozama',
};

// ─── Estado interno ───────────────────────────────────────────────────────────
let onaMetAlerts     = [];
let lastBulletinTime = null;

// ─── Scraping real del sitio ONAMET ──────────────────────────────────────────

function extractSeverity(text) {
  const lower = text.toLowerCase();
  for (const [level, keywords] of Object.entries(SEVERITY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return level;
  }
  return null;
}

function extractRegions(text) {
  const lower = text.toLowerCase();
  const found = Object.entries(REGION_KEYS)
    .filter(([key]) => lower.includes(key))
    .map(([, name]) => name);
  return found.length > 0 ? found : ['Nacional'];
}

function parseAlertsFromHtml(html, sourceUrl) {
  const $      = cheerio.load(html);
  const alerts = [];

  // Selectores de mayor a menor especificidad — el primero con resultado gana
  const candidateSelectors = [
    '.alerta', '.alerta-meteorologica', '.alert-weather',
    '#alertas', '#avisos', '.boletin-especial', '.aviso-especial',
    '[class*="alerta"]', '[class*="aviso"]', '[class*="boletin"]',
    'article', '.entry-content', '.post-content', '.content',
  ];

  for (const selector of candidateSelectors) {
    $(selector).each((i, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.length < 30) return;

      const severity = extractSeverity(text);
      if (!severity) return;

      const heading = $(el).find('h1, h2, h3, h4, strong').first().text().trim();
      const title   = heading || text.substring(0, 80) + (text.length > 80 ? '…' : '');

      alerts.push({
        id:              `ONAMET-LIVE-${Date.now()}-${i}`,
        title,
        description:     text.substring(0, 500),
        type:            severity === 'emergency' ? 'tropical_storm' : severity,
        severity,
        affectedRegions: extractRegions(text),
        issuedAt:        new Date().toISOString(),
        source:          'ONAMET',
        sourceUrl,
      });
    });

    if (alerts.length > 0) break;
  }

  // Deduplicar por título (mismo boletín puede aparecer en varios nodos)
  const seen = new Set();
  return alerts.filter(a => {
    const key = a.title.substring(0, 60).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function scrapeOnaMetWebsite() {
  for (const url of ONAMET_URLS) {
    try {
      const { data } = await axios.get(url, {
        timeout:      9000,
        headers:      REQUEST_HEADERS,
        maxRedirects: 5,
      });

      const alerts = parseAlertsFromHtml(data, url);
      if (alerts.length > 0) {
        logger.info(`[ONAMET] ${alerts.length} alerta(s) encontrada(s) en ${url}`);
        return alerts;
      }

      logger.info(`[ONAMET] Sin alertas activas en ${url}`);
    } catch (err) {
      logger.warn(`[ONAMET] Error al consultar ${url}: ${err.message}`);
    }
  }
  return [];
}

// ─── Modo simulado (fallback o variable de entorno) ───────────────────────────

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

// ─── API pública del módulo ───────────────────────────────────────────────────

async function fetchLatestBulletin() {
  logger.info('[ONAMET] Consultando boletín...');

  // Variables de entorno activas → modo simulado inmediato
  const simulated = buildSimulatedAlerts();
  if (simulated.length > 0) {
    onaMetAlerts     = simulated;
    lastBulletinTime = new Date().toISOString();
    logger.info('[ONAMET] Modo simulado activo');
    return onaMetAlerts;
  }

  // Scraping real del sitio onamet.gob.do
  try {
    const scraped    = await scrapeOnaMetWebsite();
    onaMetAlerts     = scraped;
    lastBulletinTime = new Date().toISOString();
    if (scraped.length === 0) logger.info('[ONAMET] Sin alertas activas — estado normal');
    return onaMetAlerts;
  } catch (err) {
    logger.error(`[ONAMET] Fallo crítico en scraping: ${err.message}`);
    lastBulletinTime = new Date().toISOString();
    return onaMetAlerts; // conservar alertas previas si las hay
  }
}

function getAlerts() {
  return {
    alerts:      onaMetAlerts,
    lastUpdated: lastBulletinTime,
    source:      'ONAMET — Oficina Nacional de Meteorología, República Dominicana',
  };
}

function setManualAlert(alertData) {
  onaMetAlerts     = [alertData];
  lastBulletinTime = new Date().toISOString();
  logger.warn(`[ONAMET] Alerta manual establecida: ${alertData.title}`);
}

function clearAlerts() {
  onaMetAlerts     = [];
  lastBulletinTime = new Date().toISOString();
  logger.info('[ONAMET] Alertas limpiadas');
}

module.exports = { fetchLatestBulletin, getAlerts, setManualAlert, clearAlerts };
