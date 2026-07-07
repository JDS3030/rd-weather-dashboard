'use strict';

const db     = require('./pool');
const logger = require('../utils/logger');

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS alert_history (
    id            BIGSERIAL PRIMARY KEY,
    from_level    TEXT        NOT NULL,
    to_level      TEXT        NOT NULL,
    trigger_count INTEGER     NOT NULL DEFAULT 0,
    province      TEXT,
    triggers      JSONB       NOT NULL DEFAULT '[]',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );
`;

const CREATE_INDEX = `
  CREATE INDEX IF NOT EXISTS idx_alert_history_created_at
    ON alert_history (created_at DESC);
`;

/**
 * Crea la tabla y el índice del historial de alertas si no existen.
 * No-op en modo sin-DB. Un fallo se loguea pero no impide el arranque del
 * servidor (el historial quedará deshabilitado hasta que la DB esté sana).
 *
 * @returns {Promise<void>}
 */
async function ensureSchema() {
  if (!db.isEnabled()) return; // modo sin-DB

  try {
    await db.query(CREATE_TABLE);
    await db.query(CREATE_INDEX);
    logger.info('[DB] Esquema alert_history verificado');
  } catch (err) {
    logger.error(`[DB] Fallo al verificar el esquema: ${err.message}`);
  }
}

module.exports = { ensureSchema };
