'use strict';

/**
 * Pruebas de SEGURIDAD (requisito del enunciado: "al menos una prueba de seguridad").
 * Cada test verifica una mitigacion concreta mapeada a OWASP Top 10 / ASVS.
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { freshApp, authenticate, request } = require('./helpers');

describe('Seguridad', () => {
  let app;
  beforeEach(() => {
    app = freshApp();
  });

  test('[A05] Cabeceras de seguridad presentes (CSP, X-Content-Type-Options, etc.)', async () => {
    const res = await request(app).get('/');
    assert.ok(res.headers['content-security-policy'], 'falta Content-Security-Policy');
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'SAMEORIGIN');
    assert.equal(res.headers['x-powered-by'], undefined, 'no debe revelar X-Powered-By');
  });

  test('[A01] Acceso a la API sin sesion devuelve 401', async () => {
    const res = await request(app).get('/api/todos');
    assert.equal(res.status, 401);
  });

  test('[A01-IDOR] Un usuario no puede ver ni modificar tareas de otro', async () => {
    const alice = await authenticate(app, 'alice', 'Sup3rSecret!');
    const created = await alice.agent
      .post('/api/todos')
      .set('X-CSRF-Token', alice.csrf)
      .send({ title: 'Tarea privada de Alice' });
    const id = created.body.id;

    const bob = await authenticate(app, 'bob', 'Sup3rSecret!');
    // Bob no ve la tarea de Alice
    const list = await bob.agent.get('/api/todos');
    assert.equal(list.body.length, 0);
    // Bob no puede actualizarla (debe ser 404, no 200)
    const upd = await bob.agent.put(`/api/todos/${id}`).set('X-CSRF-Token', bob.csrf).send({ completed: true });
    assert.equal(upd.status, 404);
    // Bob no puede borrarla
    const del = await bob.agent.delete(`/api/todos/${id}`).set('X-CSRF-Token', bob.csrf);
    assert.equal(del.status, 404);
  });

  test('[A01-CSRF] Peticion que cambia estado sin token CSRF es rechazada (403)', async () => {
    const { agent } = await authenticate(app);
    const res = await agent.post('/api/todos').send({ title: 'sin csrf' });
    assert.equal(res.status, 403);
  });

  test('[A03-SQLi] Una inyeccion SQL en el login no rompe ni autentica', async () => {
    const { agent, csrf } = await authenticate(app, 'victima', 'Sup3rSecret!');
    const res = await agent
      .post('/api/auth/login')
      .set('X-CSRF-Token', csrf)
      .send({ username: "' OR '1'='1' --", password: "' OR '1'='1" });
    // Defensa en profundidad: la validacion de entrada (allow-list) rechaza el payload
    // con 400 ANTES de llegar a la consulta; si pasara, las sentencias preparadas lo
    // tratarian como dato literal y devolverian 401. Nunca debe ser 200 ni 500.
    assert.ok([400, 401].includes(res.status), `status inesperado: ${res.status}`);
    assert.notEqual(res.status, 200);
    assert.notEqual(res.status, 500);
  });

  test('[A03-XSS] El payload XSS se almacena como texto y se devuelve literal (sin ejecutar)', async () => {
    const { agent, csrf } = await authenticate(app);
    const payload = '<script>alert(1)</script>';
    const res = await agent.post('/api/todos').set('X-CSRF-Token', csrf).send({ title: payload });
    assert.equal(res.status, 201);
    // El backend almacena el texto tal cual; el frontend lo pinta con textContent
    // (no innerHTML), por lo que el navegador NO lo ejecuta. Aqui verificamos que la
    // API responde JSON (no HTML) y conserva el valor sin interpretarlo.
    assert.equal(res.body.title, payload);
    assert.match(res.headers['content-type'], /application\/json/);
  });

  test('[A07] El rate limiting protege el endpoint de login', async () => {
    const agent = request.agent(app);
    const { body } = await agent.get('/api/csrf-token');
    let limited = false;
    for (let i = 0; i < 15; i += 1) {
      const res = await agent
        .post('/api/auth/login')
        .set('X-CSRF-Token', body.csrfToken)
        .send({ username: 'noexiste', password: 'Sup3rSecret!' });
      if (res.status === 429) {
        limited = true;
        break;
      }
    }
    assert.ok(limited, 'el login deberia bloquearse tras superar el limite');
  });
});
