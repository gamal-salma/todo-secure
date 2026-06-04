'use strict';

/**
 * Limitacion de tasa (rate limiting).
 *
 * Decisiones de seguridad (S-SDLC: Diseno):
 * - Limite estricto en /api/auth/* para frenar ataques de fuerza bruta y
 *   credential stuffing sobre el login (OWASP A07:2021 - Identificacion y
 *   autenticacion fallidas; ASVS V2.2.1).
 * - Limite general mas amplio para el resto de la API como proteccion frente a
 *   abuso y DoS basico de capa de aplicacion.
 */

const rateLimit = require('express-rate-limit');
const config = require('../config');

// Se exponen como FABRICAS (no singletons) para que cada instancia de la app tenga
// su propio contador en memoria. Esto evita acoplamiento entre instancias y permite
// que los tests sean independientes (cada app arranca con el contador a cero).
function createAuthLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.authMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos. Intentalo de nuevo mas tarde.' },
  });
}

function createApiLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.apiMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Limite de peticiones excedido.' },
  });
}

module.exports = { createAuthLimiter, createApiLimiter };
