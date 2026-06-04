'use strict';

/**
 * Validacion y saneamiento de entrada (express-validator).
 *
 * Decisiones de seguridad (S-SDLC: Implementacion):
 * - Validacion estricta de TODA entrada del usuario en el limite de confianza
 *   (allow-list de longitud/formato) antes de tocar la logica de negocio
 *   (OWASP A03:2021; ASVS V5.1).
 * - trim()/escape() reducen ruido y el riesgo de inyeccion; el escape de salida
 *   real se hace en el cliente al pintar texto via textContent (no innerHTML).
 */

const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Datos de entrada invalidos',
      details: errors.array().map((e) => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
};

const credentialsRules = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 32 })
    .withMessage('El usuario debe tener entre 3 y 32 caracteres')
    .matches(/^[a-zA-Z0-9_.-]+$/)
    .withMessage('El usuario solo admite letras, numeros, ".", "_" y "-"'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('La contrasena debe tener entre 8 y 128 caracteres'),
  handleValidation,
];

const todoCreateRules = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 280 })
    .withMessage('El titulo debe tener entre 1 y 280 caracteres'),
  handleValidation,
];

const todoUpdateRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 280 })
    .withMessage('El titulo debe tener entre 1 y 280 caracteres'),
  body('completed')
    .optional()
    .isBoolean()
    .withMessage('completed debe ser booleano')
    .toBoolean(),
  handleValidation,
];

module.exports = { credentialsRules, todoCreateRules, todoUpdateRules, handleValidation };
