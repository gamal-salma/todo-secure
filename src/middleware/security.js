'use strict';

/**
 * Cabeceras de seguridad HTTP mediante Helmet + Content-Security-Policy estricta.
 *
 * Decisiones de seguridad (S-SDLC: Diseno / Implementacion):
 * - CSP que solo permite recursos del propio origen ('self') y prohibe scripts en
 *   linea -> mitiga XSS (OWASP A03:2021; ASVS V14.4.3). El frontend carga su JS desde
 *   /app.js (fichero externo), nunca inline, para poder mantener la CSP sin 'unsafe-inline'.
 * - HSTS activo en produccion para forzar HTTPS (ASVS V9.1).
 * - Se desactiva X-Powered-By para no revelar el stack (reduccion de huella).
 */

const helmet = require('helmet');
const config = require('../config');

function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"], // anti clickjacking
        upgradeInsecureRequests: config.isProd ? [] : null,
      },
    },
    hsts: config.isProd ? { maxAge: 15552000, includeSubDomains: true } : false,
    referrerPolicy: { policy: 'no-referrer' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
  });
}

module.exports = { securityHeaders };
