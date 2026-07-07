'use strict';

const { Pool } = require('pg');
const logger   = require('../utils/logger');

/**
 * Acceso a PostgreSQL a través de un pool singleton.
 *
 * Si no hay DATABASE_URL configurada, el pool es null — el backend opera en
 * "modo sin-DB" (degradación elegante): arranca igual y el historial de
 * alertas simplemente no se persiste. Esto permite correr local y los tests
 * sin Postgres instalado.
 *
 * Se expone como { isEnabled, query } (en vez del pool crudo) para que el
 * resto del código no dependa de la forma del pool y sea fácil de espiar en
 * tests con vi.spyOn.
 */

const { DATABASE_URL, NODE_ENV } = process.env;

let pool = null;

if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    // Railway (y la mayoría de proveedores gestionados) exigen SSL, pero con
    // certificados que Node no reconoce por defecto en producción.
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  pool.on('error', err => {
    logger.error(`[DB] Error inesperado del pool: ${err.message}`);
  });

  logger.info('[DB] Pool PostgreSQL inicializado');
} else {
  logger.warn('[DB] Sin DATABASE_URL — persistencia deshabilitada (modo sin-DB)');
}

/** @returns {boolean} true si hay una conexión PostgreSQL configurada. */
function isEnabled() {
  return pool !== null;
}

/**
 * Ejecuta una query. Solo debe llamarse cuando isEnabled() es true.
 * @param {string} text
 * @param {Array} [params]
 */
function query(text, params) {
  return pool.query(text, params);
}

module.exports = { isEnabled, query };
