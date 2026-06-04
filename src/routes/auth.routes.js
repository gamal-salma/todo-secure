'use strict';

/**
 * Rutas de autenticacion: registro, login, logout y sesion actual.
 *
 * Decisiones de seguridad (S-SDLC: Implementacion):
 * - Regeneracion del id de sesion tras un login correcto -> previene fijacion de
 *   sesion (session fixation; OWASP A07:2021; ASVS V3.2.1).
 * - Rate limiting aplicado en app.js sobre todo /api/auth.
 * - Mensajes de error genericos en login para no permitir enumeracion de usuarios.
 */

const express = require('express');
const router = express.Router();
const userService = require('../services/user.service');
const { credentialsRules } = require('../middleware/validate');
const logger = require('../lib/logger');

router.post('/register', credentialsRules, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await userService.createUser(username, password);
    logger.info({ userId: user.id }, 'Usuario registrado');
    res.status(201).json({ id: user.id, username: user.username });
  } catch (err) {
    next(err);
  }
});

router.post('/login', credentialsRules, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await userService.verifyCredentials(username, password);
    if (!user) {
      logger.warn({ username }, 'Intento de login fallido');
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }
    // Anti session-fixation: se regenera la sesion antes de asociar al usuario.
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.userId = user.id;
      req.session.username = user.username;
      logger.info({ userId: user.id }, 'Login correcto');
      res.json({ id: user.id, username: user.username });
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('todo.sid');
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ id: req.session.userId, username: req.session.username });
  }
  res.status(401).json({ error: 'No autenticado' });
});

module.exports = router;
