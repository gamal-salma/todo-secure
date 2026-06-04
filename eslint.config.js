'use strict';

/**
 * Configuracion de ESLint (flat config) con el plugin de SEGURIDAD.
 *
 * DevSecOps: aporta analisis estatico (SAST) ligero ejecutable en local y en CI,
 * complementario a Semgrep y CodeQL. Detecta patrones peligrosos de Node.js
 * (eval, child_process, regex inseguras, etc.) -> OWASP A03/A05.
 */

const security = require('eslint-plugin-security');

module.exports = [
  {
    files: ['src/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
    },
    plugins: { security },
    rules: {
      ...security.configs.recommended.rules,
      // El acceso dinamico por propiedad es habitual y controlado en este proyecto.
      'security/detect-object-injection': 'off',
    },
  },
];
