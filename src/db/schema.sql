-- Esquema de la base de datos del to-do seguro.
-- Decision de seguridad (S-SDLC: Diseno):
--  * Cada tarea pertenece a un usuario (user_id) con FOREIGN KEY y ON DELETE CASCADE:
--    el control de autorizacion a nivel de datos refuerza el control a nivel de aplicacion
--    (defensa en profundidad frente a IDOR / OWASP A01:2021 - Broken Access Control).
--  * Se almacena solo el HASH de la contrasena (bcrypt), nunca el texto plano (ASVS V2.4).

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS todos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL,
  title       TEXT    NOT NULL,
  completed   INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0, 1)),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos (user_id);
