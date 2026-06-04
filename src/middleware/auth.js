'use strict';

/**
 * Control de acceso basado en sesion.
 *
 * Decision de seguridad (S-SDLC: Diseno):
 * - "Deny by default": cualquier ruta de la API protegida exige sesion autenticada.
 *   Si no hay usuario en la sesion se responde 401 sin filtrar informacion
 *   (OWASP A01:2021; ASVS V4.1.1).
 */

function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'No autenticado' });
}

module.exports = { requireAuth };
