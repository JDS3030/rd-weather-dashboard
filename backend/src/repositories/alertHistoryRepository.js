'use strict';

const db     = require('../db/pool');
const logger = require('../utils/logger');

const MAX_LIMIT     = 200;
const DEFAULT_LIMIT = 50;

const INSERT_SQL = `
  INSERT INTO alert_history (from_level, to_level, trigger_count, province, triggers)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING id, created_at;
`;

const SELECT_RECENT_SQL = `
  SELECT id, from_level, to_level, trigger_count, province, triggers, created_at
  FROM alert_history
  ORDER BY created_at DESC
  LIMIT $1;
`;

/**
 * Convierte una fila de la tabla a la forma que consume la API/frontend.
 * @param {object} row
 */
function mapRow(row) {
  return {
    id:           Number(row.id),
    from:         row.from_level,
    to:           row.to_level,
    triggerCount: row.trigger_count,
    province:     row.province,
    triggers:     row.triggers,
    createdAt:    row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

/**
 * Registra un cambio de nivel de alerta. No-op en modo sin-DB.
 * Fire-and-forget: un fallo se captura y loguea, nunca se propaga.
 *
 * @param {{fromLevel:string, toLevel:string, triggerCount?:number, province?:string|null, triggers?:Array}} entry
 * @returns {Promise<void>}
 */
async function insert(entry) {
  if (!db.isEnabled()) return; // modo sin-DB

  const {
    fromLevel,
    toLevel,
    triggerCount = 0,
    province     = null,
    triggers     = [],
  } = entry;

  try {
    await db.query(INSERT_SQL, [
      fromLevel,
      toLevel,
      triggerCount,
      province,
      JSON.stringify(triggers),
    ]);
  } catch (err) {
    logger.error(`[DB] Fallo al insertar historial de alerta: ${err.message}`);
  }
}

/**
 * Devuelve los últimos N cambios de nivel, más recientes primero.
 * Devuelve [] en modo sin-DB o ante un fallo de lectura.
 *
 * @param {number} [limit=50]
 * @returns {Promise<Array>}
 */
async function getRecent(limit = DEFAULT_LIMIT) {
  if (!db.isEnabled()) return []; // modo sin-DB

  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  try {
    const { rows } = await db.query(SELECT_RECENT_SQL, [safeLimit]);
    return rows.map(mapRow);
  } catch (err) {
    logger.error(`[DB] Fallo al leer historial de alertas: ${err.message}`);
    return [];
  }
}

module.exports = { insert, getRecent, MAX_LIMIT, DEFAULT_LIMIT };
