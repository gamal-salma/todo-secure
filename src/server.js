'use strict';

/**
 * Punto de entrada del servidor.
 *
 * Decisiones de seguridad/operacion (S-SDLC: Despliegue):
 * - Apagado controlado (graceful shutdown) ante SIGTERM/SIGINT para cerrar la BD y
 *   no dejar la sesion/datos en estado inconsistente al detener el contenedor.
 */

const { createApp } = require('./app');
const db = require('./db');
const config = require('./config');
const logger = require('./lib/logger');

db.init();
const app = createApp();

const server = app.listen(config.port, config.host, () => {
  logger.info({ host: config.host, port: config.port, env: config.env }, 'Servidor escuchando');
});

function shutdown(signal) {
  logger.info({ signal }, 'Cerrando servidor...');
  server.close(() => {
    db.close();
    logger.info('Servidor cerrado correctamente');
    process.exit(0);
  });
  // Si no cierra en 10s, forzamos salida.
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
