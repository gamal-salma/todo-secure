'use strict';

/*
 * Cliente del to-do. Notas de seguridad en el frontend:
 * - El texto de cada tarea se pinta con textContent (NUNCA innerHTML) -> el navegador
 *   no interpreta HTML, lo que neutraliza XSS almacenado aunque el backend fallara.
 * - Cada peticion que cambia estado adjunta el token CSRF en la cabecera X-CSRF-Token.
 * - Las cookies de sesion las gestiona el navegador (httpOnly), el JS no las toca.
 */

const state = { mode: 'login', csrf: null };

const $ = (id) => document.getElementById(id);

async function getCsrf() {
  if (state.csrf) return state.csrf;
  const res = await fetch('/api/csrf-token', { credentials: 'same-origin' });
  const data = await res.json();
  state.csrf = data.csrfToken;
  return state.csrf;
}

async function api(method, url, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (method !== 'GET') headers['X-CSRF-Token'] = await getCsrf();
  const res = await fetch(url, {
    method,
    headers,
    credentials: 'same-origin',
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  if (res.status !== 204) {
    data = await res.json().catch(() => null);
  }
  if (!res.ok) {
    const message = (data && data.error) || 'Error inesperado';
    throw new Error(message);
  }
  return data;
}

function setMode(mode) {
  state.mode = mode;
  $('tabLogin').classList.toggle('active', mode === 'login');
  $('tabRegister').classList.toggle('active', mode === 'register');
  $('authSubmit').textContent = mode === 'login' ? 'Entrar' : 'Crear cuenta';
  $('authError').textContent = '';
}

function showApp(username) {
  $('authView').classList.add('hidden');
  $('todoView').classList.remove('hidden');
  $('userArea').classList.remove('hidden');
  $('userLabel').textContent = username;
  loadTodos();
}

function showAuth() {
  $('authView').classList.remove('hidden');
  $('todoView').classList.add('hidden');
  $('userArea').classList.add('hidden');
}

function renderTodos(todos) {
  const list = $('todoList');
  list.replaceChildren();
  $('todoEmpty').classList.toggle('hidden', todos.length > 0);

  for (const todo of todos) {
    const li = document.createElement('li');
    li.className = 'todo-item' + (todo.completed ? ' done' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.addEventListener('change', () => toggleTodo(todo, checkbox.checked));

    const span = document.createElement('span');
    span.className = 'title';
    span.textContent = todo.title; // XSS-safe: no se interpreta como HTML

    const del = document.createElement('button');
    del.textContent = 'Borrar';
    del.addEventListener('click', () => deleteTodo(todo.id));

    li.append(checkbox, span, del);
    list.appendChild(li);
  }
}

async function loadTodos() {
  try {
    renderTodos(await api('GET', '/api/todos'));
  } catch (err) {
    console.error(err);
  }
}

async function toggleTodo(todo, completed) {
  await api('PUT', `/api/todos/${todo.id}`, { completed });
  loadTodos();
}

async function deleteTodo(id) {
  await api('DELETE', `/api/todos/${id}`);
  loadTodos();
}

async function init() {
  $('tabLogin').addEventListener('click', () => setMode('login'));
  $('tabRegister').addEventListener('click', () => setMode('register'));

  $('authForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('authError').textContent = '';
    const username = $('username').value.trim();
    const password = $('password').value;
    try {
      if (state.mode === 'register') {
        await api('POST', '/api/auth/register', { username, password });
      }
      const user = await api('POST', '/api/auth/login', { username, password });
      // El login regenera la sesion (anti session-fixation) y rota el token CSRF;
      // invalidamos el token en cache para forzar su renovacion en la proxima
      // peticion que cambie estado.
      state.csrf = null;
      showApp(user.username);
    } catch (err) {
      $('authError').textContent = err.message;
    }
  });

  $('logoutBtn').addEventListener('click', async () => {
    await api('POST', '/api/auth/logout');
    state.csrf = null;
    showAuth();
  });

  $('todoForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = $('todoTitle');
    const title = input.value.trim();
    if (!title) return;
    await api('POST', '/api/todos', { title });
    input.value = '';
    loadTodos();
  });

  // Comprueba si ya hay sesion activa.
  try {
    const me = await api('GET', '/api/auth/me');
    showApp(me.username);
  } catch {
    showAuth();
  }
}

document.addEventListener('DOMContentLoaded', init);
