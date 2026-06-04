'use strict';

/**
 * Logger estructurado (pino).
 *
 * Decision de seguridad (S-SDLC: Implementacion / Operacion):
 * - Logging estructurado en JSON para trazabilidad y respuesta ante incidentes
 *   (OWASP A09:2021 - Fallos de registro y monitorizacion; ASVS V7).
 * - REDACCION de datos sensibles: nunca se registran contrasenas, cookies,
 *   cabeceras de autorizacion ni el secreto de sesion. Evita fugas de credenciales
 *   en los logs (NIST SSDF PW.1 / PW.5).
 */

const pino = require('pino');
const config = require('../config');

const logger = pino({
  level: config.logLevel,
  // Nunca registrar PII/credenciales: se redactan rutas sensibles.
  redact: {
    paths: [
      'req.headers.cookie',
      'req.headers.authorization',
      'req.body.password',
      'req.body.confirmPassword',
      'res.headers["set-cookie"]',
      '*.password',
      '*.secret',
    ],
    censor: '[REDACTADO]',
  },
  // Pretty-print solo en desarrollo (legibilidad); JSON puro en prod (ingestible por SIEM).
  transport:
    config.isProd || config.isTest
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
});

module.exports = logger;
