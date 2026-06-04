'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { freshApp, authenticate, request } = require('./helpers');

describe('Autenticacion', () => {
  let app;
  beforeEach(() => {
    app = freshApp();
  });

  test('registro + login correcto devuelve el usuario', async () => {
    const { agent } = await authenticate(app);
    const res = await agent.get('/api/auth/me');
    assert.equal(res.status, 200);
    assert.equal(res.body.username, 'tester');
  });

  test('login con contrasena incorrecta devuelve 401 generico', async () => {
    const agent = request.agent(app);
    const { body } = await agent.get('/api/csrf-token');
    await agent.post('/api/auth/register').set('X-CSRF-Token', body.csrfToken).send({ username: 'ana', password: 'Sup3rSecret!' });
    const res = await agent.post('/api/auth/login').set('X-CSRF-Token', body.csrfToken).send({ username: 'ana', password: 'incorrecta' });
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Credenciales invalidas');
  });

  test('no se puede registrar el mismo usuario dos veces', async () => {
    const agent = request.agent(app);
    const { body } = await agent.get('/api/csrf-token');
    await agent.post('/api/auth/register').set('X-CSRF-Token', body.csrfToken).send({ username: 'dup', password: 'Sup3rSecret!' });
    const res = await agent.post('/api/auth/register').set('X-CSRF-Token', body.csrfToken).send({ username: 'dup', password: 'Sup3rSecret!' });
    assert.equal(res.status, 409);
  });

  test('valida la fortaleza minima de la contrasena (>=8)', async () => {
    const agent = request.agent(app);
    const { body } = await agent.get('/api/csrf-token');
    const res = await agent.post('/api/auth/register').set('X-CSRF-Token', body.csrfToken).send({ username: 'pepe', password: '123' });
    assert.equal(res.status, 400);
  });

  test('logout cierra la sesion', async () => {
    const { agent, csrf } = await authenticate(app);
    await agent.post('/api/auth/logout').set('X-CSRF-Token', csrf);
    const res = await agent.get('/api/auth/me');
    assert.equal(res.status, 401);
  });
});
