'use strict';

/* =============================================================================
 *  ⚠️  CODIGO DELIBERADAMENTE INSEGURO  -  NO DESPLEGAR  ⚠️
 * -----------------------------------------------------------------------------
 *  Fichero creado EX PROFESO para la Actividad de la Unidad 4: introduce
 *  vulnerabilidades para que las herramientas de analisis (SAST/SCA/secretos)
 *  generen alertas. Cada bloque indica el riesgo OWASP/CWE que dispara.
 *  La version SEGURA y correcta de la aplicacion esta en ../src/.
 * ========================================================================== */

const express = require('express');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');

const app = express();
app.use(express.json());
const db = new DatabaseSync(':memory:');

// [A02 / CWE-798] Secreto HARDCODEADO.
// NOTA: en esta version de GitHub los valores estan REDACTADOS porque el propio
// "GitHub Push Protection" (secret scanning) bloquea el push si contiene secretos
// reales -> es otra herramienta de seguridad de GitHub actuando. La version del zip
// conserva valores realistas y gitleaks los detecto en local (ver el informe).
const SESSION_SECRET = 'REDACTED_for_github__stripe_like_key';
const AWS_SECRET_ACCESS_KEY = 'REDACTED_for_github__aws_like_key';
const dbPassword = 'REDACTED_for_github__db_password';

// [A03 / CWE-89] SQL injection por concatenacion (Semgrep/CodeQL) -------------
app.get('/users', (req, res) => {
  const name = req.query.name;
  const row = db.prepare("SELECT * FROM users WHERE username = '" + name + "'").get();
  res.json(row);
});

// [A03 / CWE-79] XSS reflejado: se devuelve HTML con entrada sin escapar -------
app.get('/hello', (req, res) => {
  res.send('<h1>Hola ' + req.query.user + '</h1>'); // entrada sin sanear
});

// [A03 / CWE-95] eval sobre entrada del usuario (ESLint detect-eval) ----------
app.post('/calc', (req, res) => {
  const result = eval(req.body.expr); // ejecucion de codigo arbitrario
  res.json({ result });
});

// [A03 / CWE-78] Command injection (ESLint detect-child-process) --------------
app.get('/ping', (req, res) => {
  cp.exec('ping -c 1 ' + req.query.host, (err, out) => res.send(out));
});

// [A02 / CWE-327] Hash criptografico debil (MD5) ------------------------------
function weakHash(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}

// [A02 / CWE-330] Aleatoriedad insegura para un token de seguridad ------------
function insecureToken() {
  return Math.random().toString(36).slice(2);
}

// [A05] Cookie de sesion insegura y sin endurecer -----------------------------
const session = require('express-session');
app.use(session({
  secret: SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { httpOnly: false, secure: false }, // inseguro a proposito
}));

app.listen(3000, () => console.log('INSECURE demo on 3000'));

module.exports = { weakHash, insecureToken, dbPassword, AWS_SECRET_ACCESS_KEY };
