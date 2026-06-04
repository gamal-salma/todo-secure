'use strict';

/**
 * Manejadores de 404 y de error centralizado.
 *
 * Decisiones de seguridad (S-SDLC: Implementacion / Operacion):
 * - El cliente NUNCA recibe trazas de pila ni detalles internos en produccion: se
 *   devuelve un mensaje generico (OWASP A05:2021; ASVS V7.4.1). El detalle completo
 *   queda en el log estructurado del servidor para diagnostico.
 */

const logger = require('../lib/logger');
const config = require('../config');

function notFound(req, res) {
  res.status(404).json({ error: 'Recurso no encontrado' });
}

// El 4o parametro (next) es obligatorio para que Express lo trate como manejador de errores.
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    logger.error({ err, reqId: req.id }, 'Error no controlado');
  } else {
    logger.warn({ msg: err.message, status, reqId: req.id }, 'Error de cliente');
  }
  res.status(status).json({
    error: status >= 500 && config.isProd ? 'Error interno del servidor' : err.message,
    code: err.code,
  });
}

module.exports = { notFound, errorHandler };
