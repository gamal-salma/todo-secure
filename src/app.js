'use strict';

/**
 * Fabrica de la aplicacion Express (separada del arranque del servidor para poder
 * instanciarla en los tests sin abrir un puerto). Aqui se ENCADENA toda la defensa
 * en profundidad de la app to-do, en el orden correcto.
 */

const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const session = require('express-session');
const pinoHttp = require('pino-http');

const config = require('./config');
const logger = require('./lib/logger');
const { securityHeaders } = require('./middleware/security');
const { csrfProtection, csrfTokenHandler } = require('./middleware/csrf');
const { requireAuth } = require('./middleware/auth');
const { createAuthLimiter, createApiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const todosRoutes = require('./routes/todos.routes');

function createApp() {
  const app = express();

  // No revelar el framework subyacente.
  app.disable('x-powered-by');

  // Necesario para que las cookies "secure" funcionen tras un proxy TLS.
  if (config.trustProxy) app.set('trust proxy', 1);

  // 1) Logging estructurado con id de peticion por cada request.
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),
    })
  );

  // 2) Cabeceras de seguridad (Helmet + CSP estricta).
  app.use(securityHeaders());

  // 3) Parseo de cuerpo con limite de tamano (anti payloads gigantes / DoS).
  app.use(express.json({ limit: '16kb' }));
  app.use(express.urlencoded({ extended: false, limit: '16kb' }));

  // 4) Sesiones con cookie endurecida.
  //    NOTA: el almacen por defecto (MemoryStore) es valido para desarrollo/demo;
  //    en produccion debe sustituirse por un store persistente (p. ej. Redis).
  //    Ver SECURITY.md -> "Limitaciones conocidas".
  app.use(
    session({
      name: config.session.name,
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true, // inaccesible a JS -> mitiga robo de sesion por XSS
        sameSite: 'lax', // mitiga CSRF de navegacion entre sitios
        secure: config.session.secureCookie, // solo HTTPS en produccion
        maxAge: config.session.maxAgeMs,
      },
    })
  );

  // 5) Proteccion CSRF (synchronizer token) para metodos que cambian estado.
  app.use(csrfProtection);

  // 6) Frontend estatico (sin JS inline para respetar la CSP).
  app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));

  // 7) Rutas.
  app.use('/api', healthRoutes);
  app.get('/api/csrf-token', csrfTokenHandler);
  app.use('/api/auth', createAuthLimiter(), authRoutes);
  app.use('/api/todos', createApiLimiter(), requireAuth, todosRoutes);

  // 8) 404 + manejador de errores centralizado.
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
