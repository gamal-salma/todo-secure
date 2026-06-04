'use strict';

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { freshApp, authenticate } = require('./helpers');

describe('CRUD de tareas', () => {
  let app;
  beforeEach(() => {
    app = freshApp();
  });

  test('crea, lista, actualiza y borra una tarea', async () => {
    const { agent, csrf } = await authenticate(app);

    // Crear
    let res = await agent.post('/api/todos').set('X-CSRF-Token', csrf).send({ title: 'Comprar pan' });
    assert.equal(res.status, 201);
    assert.equal(res.body.title, 'Comprar pan');
    assert.equal(res.body.completed, false);
    const id = res.body.id;

    // Listar
    res = await agent.get('/api/todos');
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 1);

    // Actualizar (marcar completada)
    res = await agent.put(`/api/todos/${id}`).set('X-CSRF-Token', csrf).send({ completed: true });
    assert.equal(res.status, 200);
    assert.equal(res.body.completed, true);

    // Borrar
    res = await agent.delete(`/api/todos/${id}`).set('X-CSRF-Token', csrf);
    assert.equal(res.status, 204);

    res = await agent.get('/api/todos');
    assert.equal(res.body.length, 0);
  });

  test('rechaza titulos vacios o demasiado largos', async () => {
    const { agent, csrf } = await authenticate(app);
    let res = await agent.post('/api/todos').set('X-CSRF-Token', csrf).send({ title: '' });
    assert.equal(res.status, 400);
    res = await agent.post('/api/todos').set('X-CSRF-Token', csrf).send({ title: 'x'.repeat(281) });
    assert.equal(res.status, 400);
  });

  test('devuelve 404 al actualizar una tarea inexistente', async () => {
    const { agent, csrf } = await authenticate(app);
    const res = await agent.put('/api/todos/99999').set('X-CSRF-Token', csrf).send({ completed: true });
    assert.equal(res.status, 404);
  });
});
