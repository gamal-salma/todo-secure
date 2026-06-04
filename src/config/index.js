'use strict';

/**
 * Configuracion central de la aplicacion.
 *
 * Decision de seguridad (S-SDLC: Requisitos / Implementacion):
 * - Toda la configuracion sensible (secreto de sesion, entorno, puerto) se lee
 *   EXCLUSIVAMENTE de variables de entorno. Nunca se incrustan secretos en el codigo
 *   ni en el repositorio (ver .env.example / .gitignore). NIST SSDF PW.5 / PS.1.
 * - Se valida el "fail-fast": en produccion, si falta SESSION_SECRET o es debil,
 *   el proceso aborta. Evita desplegar con un secreto por defecto predecible
 *   (OWASP A02:2021 - Fallos criptograficos / A05 - Mala configuracion).
 */

require('dotenv').config();

function required(name, value, { minLength = 0 } = {}) {
  if (value === undefined || value === null || value === '') {
    throw new Error(`[config] La variable de entorno obligatoria ${name} no esta definida.`);
  }
  if (minLength && String(value).length < minLength) {
    throw new Error(`[config] La variable ${name} es demasiado corta (minimo ${minLength} caracteres).`);
  }
  return value;
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProd = NODE_ENV === 'production';

// En produccion exigimos un secreto fuerte; en desarrollo permitimos uno efimero
// generado en memoria para no bloquear el arranque local, pero avisando.
let sessionSecret = process.env.SESSION_SECRET;
if (isProd) {
  sessionSecret = required('SESSION_SECRET', sessionSecret, { minLength: 32 });
} else if (!sessionSecret) {
  // Aviso explicito: secreto efimero solo valido para desarrollo.
  sessionSecret = require('node:crypto').randomBytes(32).toString('hex');
  console.warn('[config] SESSION_SECRET no definido: usando un secreto efimero (SOLO desarrollo).');
}

const config = Object.freeze({
  env: NODE_ENV,
  isProd,
  isTest: NODE_ENV === 'test',
  host: process.env.HOST || '0.0.0.0',
  port: Number.parseInt(process.env.PORT || '3000', 10),
  // Ruta del fichero SQLite. En contenedor se monta un volumen en /app/data.
  databasePath: process.env.DATABASE_PATH || './data/todo.db',
  session: {
    secret: sessionSecret,
    name: 'todo.sid',
    // Tiempo de vida de la sesion: 30 minutos de inactividad.
    maxAgeMs: Number.parseInt(process.env.SESSION_MAX_AGE_MS || String(30 * 60 * 1000), 10),
    // En produccion la cookie viaja solo por HTTPS (secure). Detras de un proxy/balanceador
    // TLS hay que activar TRUST_PROXY=1 para que Express respete X-Forwarded-Proto.
    secureCookie: isProd,
  },
  trustProxy: process.env.TRUST_PROXY === '1',
  logLevel: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  bcryptRounds: Number.parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  rateLimit: {
    windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10),
    authMax: Number.parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10),
    apiMax: Number.parseInt(process.env.RATE_LIMIT_API_MAX || '300', 10),
  },
});

module.exports = config;
