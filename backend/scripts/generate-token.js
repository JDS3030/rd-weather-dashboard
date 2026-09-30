#!/usr/bin/env node
'use strict';

/**
 * Generador de JWT (Bearer token) — NubeVigía RD
 *
 * Firma un token con JWT_SECRET para poder llamar al endpoint protegido
 * POST /api/alerts/refresh y para usarlo en los tests del Proceso 3.
 *
 * Requisito: la variable de entorno JWT_SECRET debe estar definida
 * (se carga desde backend/.env vía dotenv).
 *
 * Uso:
 *   node scripts/generate-token.js                 # payload por defecto, expira en 1h
 *   node scripts/generate-token.js 7d              # expira en 7 días
 *   node scripts/generate-token.js 30m operador    # expiración y rol personalizados
 *
 * Argumentos (opcionales, posicionales):
 *   1) expiración  → cualquier formato aceptado por jsonwebtoken (p. ej. 1h, 7d, 30m). Def: 1h
 *   2) rol         → valor de `role` en el payload. Def: admin
 *
 * Ejemplo de uso del token generado:
 *   curl -X POST http://localhost:3001/api/alerts/refresh \
 *        -H "Authorization: Bearer <TOKEN>"
 */

require('dotenv').config();
const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('[AUTH] Error: JWT_SECRET no está definido. Configúralo en backend/.env');
  console.error('  Genera uno con: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
  process.exit(1);
}

const expiresIn = process.argv[2] || '1h';
const role      = process.argv[3] || 'admin';

const payload = { sub: 'service', role };

const token = jwt.sign(payload, secret, { expiresIn });

console.log(token);
