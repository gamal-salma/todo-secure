'use strict';

/**
 * Utilidades comunes para los tests. Cada suite arranca con una base de datos
 * SQLite EN MEMORIA (DATABASE_PATH=:memory:) -> tests aislados, deterministas y sin
 * efectos en disco (buena practica de S-SDLC: pruebas reproducibles).
 */

process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = ':memory:';
process.env.SESSION_SECRET = 'test-secret-suficientemente-largo-para-tests-1234';

const request = require('supertest');
const { createApp } = require('../src/app');
const db = require('../src/db');

function freshApp() {
  db.close();
  db.init();
  return createApp();
}

/** Devuelve un agente autenticado y su token CSRF ya rotado tras el login. */
async function authenticate(app, username = 'tester', password = 'Sup3rSecret!') {
  const agent = request.agent(app);
  let res = await agent.get('/api/csrf-token');
  let csrf = res.body.csrfToken;

  await agent.post('/api/auth/register').set('X-CSRF-Token', csrf).send({ username, password });
  await agent.post('/api/auth/login').set('X-CSRF-Token', csrf).send({ username, password });

  // El login regenera la sesion, asi que pedimos un token CSRF nuevo.
  res = await agent.get('/api/csrf-token');
  csrf = res.body.csrfToken;

  return { agent, csrf };
}

module.exports = { request, freshApp, authenticate, db };
