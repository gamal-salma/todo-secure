'use strict';

/**
 * Capa de acceso a datos sobre node:sqlite (modulo integrado de Node.js >= 22.5).
 *
 * Decisiones de seguridad (S-SDLC: Diseno / Implementacion):
 * - SQLite integrado: cero dependencias nativas -> menor superficie de cadena de
 *   suministro y build reproducible en contenedor (NIST SSDF PW.4 / PS.3).
 * - TODAS las consultas usan sentencias PREPARADAS con parametros (?) -> previene
 *   inyeccion SQL por construccion (OWASP A03:2021; ASVS V5.3.4).
 * - foreign_keys = ON para que el modelo de datos haga cumplir la propiedad de los
 *   recursos (defensa en profundidad frente a IDOR).
 */

const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');
const logger = require('../lib/logger');

let db;

function init() {
  if (db) return db;

  // Asegura que el directorio del fichero de BD existe (p. ej. ./data o /app/data).
  const dir = path.dirname(path.resolve(config.databasePath));
  fs.mkdirSync(dir, { recursive: true });

  db = new DatabaseSync(config.databasePath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  logger.info({ databasePath: config.databasePath }, 'Base de datos inicializada');
  return db;
}

function getDb() {
  if (!db) init();
  return db;
}

function close() {
  if (db) {
    db.close();
    db = undefined;
  }
}

module.exports = { init, getDb, close };
