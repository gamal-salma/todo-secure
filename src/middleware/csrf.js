'use strict';

/**
 * Proteccion CSRF mediante el patron "synchronizer token" ligado a la sesion.
 *
 * Decisiones de seguridad (S-SDLC: Diseno / Implementacion):
 * - Se genera un token aleatorio (32 bytes) por sesion y se entrega al cliente via
 *   GET /api/csrf-token. El cliente lo reenvia en la cabecera X-CSRF-Token en toda
 *   peticion que cambie estado (POST/PUT/PATCH/DELETE).
 * - La comparacion es de tiempo constante (crypto.timingSafeEqual) para no filtrar
 *   informacion por canal lateral (OWASP A01/A05; ASVS V4.2.2 / V13.2.3).
 * - Se implementa manualmente y sin dependencias (csurf esta deprecado): codigo
 *   auditable y minima superficie de cadena de suministro.
 */

const crypto = require('node:crypto');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function ensureToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  return req.session.csrfToken;
}

function csrfProtection(req, res, next) {
  // Las peticiones seguras (de solo lectura) no requieren token, pero garantizamos
  // que exista uno en sesion para que el cliente pueda solicitarlo.
  if (SAFE_METHODS.has(req.method)) {
    ensureToken(req);
    return next();
  }

  const sessionToken = req.session && req.session.csrfToken;
  const headerToken = req.get('X-CSRF-Token') || (req.body && req.body._csrf);

  if (!sessionToken || !headerToken) {
    return res.status(403).json({ error: 'Token CSRF ausente' });
  }

  const a = Buffer.from(String(sessionToken));
  const b = Buffer.from(String(headerToken));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).json({ error: 'Token CSRF invalido' });
  }
  return next();
}

function csrfTokenHandler(req, res) {
  res.json({ csrfToken: ensureToken(req) });
}

module.exports = { csrfProtection, csrfTokenHandler };
