'use strict';

/**
 * Rutas CRUD de tareas. Todas exigen sesion (requireAuth aplicado en app.js) y
 * operan SIEMPRE en el ambito del usuario autenticado (req.session.userId), nunca
 * sobre un userId recibido del cliente -> mitiga IDOR (OWASP A01:2021).
 */

const express = require('express');
const router = express.Router();
const todoService = require('../services/todo.service');
const { todoCreateRules, todoUpdateRules } = require('../middleware/validate');

router.get('/', (req, res) => {
  res.json(todoService.listByUser(req.session.userId));
});

router.post('/', todoCreateRules, (req, res) => {
  const todo = todoService.create(req.session.userId, req.body.title);
  res.status(201).json(todo);
});

router.put('/:id', todoUpdateRules, (req, res, next) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identificador invalido' });
  }
  const updated = todoService.update(req.session.userId, id, {
    title: req.body.title,
    completed: req.body.completed,
  });
  if (!updated) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Identificador invalido' });
  }
  const ok = todoService.remove(req.session.userId, id);
  if (!ok) return res.status(404).json({ error: 'Tarea no encontrada' });
  res.status(204).end();
});

module.exports = router;
