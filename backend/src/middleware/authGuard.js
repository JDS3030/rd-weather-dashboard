'use strict';

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * authGuard — protege rutas que requieren un JWT válido.
 *
 * Espera el header `Authorization: Bearer <token>`.
 * Verifica la firma y la expiración con `process.env.JWT_SECRET`.
 *
 * Comportamiento fail-closed:
 *   - Si JWT_SECRET no está definido → 500 (mala configuración del servidor),
 *     NUNCA deja pasar la petición sin verificar.
 *   - Sin header / formato inválido / firma inválida / token expirado → 401.
 *
 * En éxito adjunta `req.auth = payload` y llama a `next()`.
 * No filtra detalles internos de jwt en la respuesta.
 */
function authGuard(req, res, next) {
  const secret = process.env.JWT_SECRET;

  // Fail-closed: sin secreto configurado no se puede verificar nada.
  if (!secret) {
    logger.error('[AUTH] JWT_SECRET no está definido; se rechaza la petición (fail-closed)');
    const err = new Error('Configuración de autenticación no disponible');
    err.status = 500;
    return next(err);
  }

  const header = req.headers.authorization || '';
  const parts = header.split(' ');

  if (parts.length !== 2 || !/^Bearer$/i.test(parts[0]) || !parts[1]) {
    logger.warn(`[AUTH] Header Authorization ausente o mal formado — ${req.method} ${req.originalUrl}`);
    const err = new Error('No autorizado: se requiere un token Bearer');
    err.status = 401;
    return next(err);
  }

  const token = parts[1];

  try {
    const payload = jwt.verify(token, secret);
    req.auth = payload;
    logger.info(`[AUTH] Token válido (sub=${payload && payload.sub ? payload.sub : 'n/a'}) — ${req.method} ${req.originalUrl}`);
    return next();
  } catch (e) {
    // No se filtra el detalle de jwt (e.message/stack) al cliente.
    logger.warn(`[AUTH] Token inválido o expirado (${e.name}) — ${req.method} ${req.originalUrl}`);
    const err = new Error('No autorizado: token inválido o expirado');
    err.status = 401;
    return next(err);
  }
}

module.exports = authGuard;
