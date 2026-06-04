# Arquitectura — To-Do Seguro

## Visión general

Aplicación web de lista de tareas (to-do) construida como **monolito modular** en
Node.js + Express, con persistencia en **SQLite** (módulo integrado `node:sqlite`) y
**contenerizada** en Docker. La separación en capas facilita razonar sobre seguridad y
añadir controles sin "ensuciar" la lógica de negocio.

Diagrama: `docs/diagrams/architecture.png` (fuente: `architecture.drawio`).

## Capas

```
Navegador  ──HTTP──►  Express (app.js)
                         │  middlewares (orden importa):
                         │   1. pino-http (logging + reqId)
                         │   2. helmet + CSP           (cabeceras)
                         │   3. body parser (límite 16kB)
                         │   4. express-session        (cookie endurecida)
                         │   5. csrfProtection         (synchronizer token)
                         │   6. estáticos (frontend sin JS inline)
                         │   7. rutas: /api/auth, /api/todos, /api/health
                         │   8. 404 + errorHandler
                         ▼
                      Rutas (routes/) ──► Servicios (services/) ──► DB (db/, node:sqlite)
```

## Componentes y responsabilidad

| Módulo | Responsabilidad | Control de seguridad asociado |
|--------|-----------------|-------------------------------|
| `src/config` | Configuración por entorno | Fail-fast si falta `SESSION_SECRET` en prod |
| `src/lib/logger` | Logging estructurado | Redacción de secretos |
| `src/db` | Acceso a datos | Sentencias preparadas, `foreign_keys=ON` |
| `src/services` | Lógica de negocio | Hashing, propiedad por `user_id` |
| `src/middleware` | Controles transversales | Auth, CSRF, validación, rate limit, cabeceras |
| `src/routes` | Endpoints HTTP | Validación + autorización por ruta |
| `src/public` | Frontend | `textContent` anti-XSS, CSRF en cabecera |

## Decisiones arquitectónicas con impacto en seguridad

1. **`app.js` (fábrica) separado de `server.js` (arranque):** permite instanciar la app
   en los tests sin abrir puertos, habilitando pruebas de seguridad rápidas y aisladas.
2. **`node:sqlite` integrado:** cero dependencias nativas → menor superficie de cadena
   de suministro y build reproducible en Alpine sin toolchain de compilación.
3. **Orden de middlewares:** el logging y las cabeceras de seguridad se aplican antes
   que cualquier ruta; CSRF se aplica tras la sesión; `requireAuth` protege `/api/todos`.
4. **Propiedad del dato en la capa de datos:** la clave foránea `todos.user_id` y el
   filtrado por `user_id` en cada consulta hacen cumplir el control de acceso también a
   nivel de modelo (defensa en profundidad).

## Flujo de una petición protegida (crear tarea)

1. El cliente obtiene un token CSRF (`GET /api/csrf-token`).
2. Envía `POST /api/todos` con cookie de sesión + cabecera `X-CSRF-Token`.
3. `requireAuth` verifica la sesión (401 si no hay).
4. `csrfProtection` valida el token (403 si falta/no coincide).
5. `todoCreateRules` valida el `title` (400 si inválido).
6. El servicio inserta con sentencia preparada asociando `req.session.userId`.
7. Respuesta `201` con la tarea creada; evento registrado en el log.
