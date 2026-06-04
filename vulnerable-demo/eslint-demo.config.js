'use strict';

// Config ESLint SOLO para escanear la carpeta vulnerable-demo (Unidad 4).
// Separado del eslint.config.js principal para no romper el lint de la app segura.
//   npx eslint -c vulnerable-demo/eslint-demo.config.js vulnerable-demo/insecure-app.js vulnerable-demo/insecure-frontend.js

const security = require('eslint-plugin-security');

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'commonjs' },
    plugins: { security },
    rules: { ...security.configs.recommended.rules },
  },
];
