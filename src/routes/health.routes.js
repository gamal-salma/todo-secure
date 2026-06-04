'use strict';

/**
 * Endpoint de salud para el HEALTHCHECK del contenedor (S-SDLC: Despliegue/Operacion).
 * No expone informacion sensible ni versiones internas.
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
