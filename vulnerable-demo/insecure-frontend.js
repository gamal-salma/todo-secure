'use strict';

/* ⚠️ FRONTEND INSEGURO A PROPOSITO (Unidad 4). NO USAR. ⚠️
 * La version segura usa textContent (ver ../src/public/app.js). */

// [A03 / CWE-79] XSS almacenado/reflejado: innerHTML con datos del usuario
function renderTodo(todo) {
  const li = document.createElement('li');
  li.innerHTML = '<span>' + todo.title + '</span>'; // <- ejecuta HTML/JS inyectado
  document.getElementById('list').appendChild(li);
}

// [A03 / CWE-79] document.write con parametro de la URL
const params = new URLSearchParams(location.search);
document.write('Bienvenido ' + params.get('user'));

// [A03 / CWE-95] eval de datos remotos
function runConfig(text) {
  eval(text);
}

module.exports = { renderTodo, runConfig };
