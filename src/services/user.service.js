'use strict';

/**
 * Servicio de usuarios: registro y autenticacion.
 *
 * Decisiones de seguridad (S-SDLC: Implementacion):
 * - Contrasenas con bcrypt (coste configurable, por defecto 12) -> hash lento y
 *   con sal por diseno (OWASP A02:2021; ASVS V2.4.1/V2.4.3).
 * - Comparacion de credenciales resistente a enumeracion de usuarios: el mensaje
 *   de error es identico tanto si el usuario no existe como si la contrasena es
 *   incorrecta (ASVS V2.2.1).
 * - Consultas SIEMPRE parametrizadas (anti SQL injection).
 */

const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const config = require('../config');

async function createUser(username, password) {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    const err = new Error('El nombre de usuario ya esta en uso');
    err.status = 409;
    err.code = 'USERNAME_TAKEN';
    throw err;
  }
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const info = db
    .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
    .run(username, passwordHash);
  return { id: Number(info.lastInsertRowid), username };
}

async function verifyCredentials(username, password) {
  const db = getDb();
  const row = db
    .prepare('SELECT id, username, password_hash FROM users WHERE username = ?')
    .get(username);

  // Para evitar oraculos de tiempo y enumeracion de usuarios, ejecutamos siempre un
  // bcrypt.compare. Si el usuario no existe, comparamos contra un hash ficticio.
  const hash = row ? row.password_hash : '$2a$12$0000000000000000000000000000000000000000000000000000';
  const ok = await bcrypt.compare(password, hash);

  if (!row || !ok) return null;
  return { id: row.id, username: row.username };
}

module.exports = { createUser, verifyCredentials };
