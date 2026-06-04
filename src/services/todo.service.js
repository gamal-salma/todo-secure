'use strict';

/**
 * Servicio de tareas (to-do).
 *
 * Decision de seguridad clave (S-SDLC: Diseno / Implementacion):
 * - El identificador de usuario SIEMPRE forma parte de la clausula WHERE. Asi, un
 *   usuario nunca puede leer, modificar ni borrar tareas de otro aunque conozca el id
 *   (mitiga IDOR / OWASP A01:2021 - Broken Access Control; ASVS V4.2.1).
 * - Consultas parametrizadas en todas las operaciones (anti SQL injection).
 */

const { getDb } = require('../db');

function listByUser(userId) {
  return getDb()
    .prepare('SELECT id, title, completed, created_at, updated_at FROM todos WHERE user_id = ? ORDER BY created_at DESC')
    .all(userId)
    .map(normalize);
}

function create(userId, title) {
  const db = getDb();
  const info = db
    .prepare('INSERT INTO todos (user_id, title) VALUES (?, ?)')
    .run(userId, title);
  return getById(userId, Number(info.lastInsertRowid));
}

function getById(userId, id) {
  const row = getDb()
    .prepare('SELECT id, title, completed, created_at, updated_at FROM todos WHERE id = ? AND user_id = ?')
    .get(id, userId);
  return row ? normalize(row) : null;
}

function update(userId, id, { title, completed }) {
  const current = getById(userId, id);
  if (!current) return null;

  const newTitle = title !== undefined ? title : current.title;
  const newCompleted = completed !== undefined ? (completed ? 1 : 0) : current.completed ? 1 : 0;

  getDb()
    .prepare("UPDATE todos SET title = ?, completed = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?")
    .run(newTitle, newCompleted, id, userId);

  return getById(userId, id);
}

function remove(userId, id) {
  const info = getDb()
    .prepare('DELETE FROM todos WHERE id = ? AND user_id = ?')
    .run(id, userId);
  return info.changes > 0;
}

function normalize(row) {
  return {
    id: row.id,
    title: row.title,
    completed: Boolean(row.completed),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

module.exports = { listByUser, create, getById, update, remove };
