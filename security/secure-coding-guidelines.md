# Guía de codificación segura — To-Do Seguro

Reglas de codificación segura que **aplica este proyecto**, con su justificación y el
lugar del código donde se cumplen. Sirve de referencia para nuevas contribuciones
(ver `CONTRIBUTING.md`).

## 1. Validación de entrada (allow-list)
- Validar **toda** entrada en el borde con listas blancas de formato y longitud.
- El `username` solo admite `[a-zA-Z0-9_.-]`; el `title` se limita a 1–280 caracteres.
- *Por qué:* reduce la superficie de inyección y de abuso antes de tocar la lógica.
- *Dónde:* `src/middleware/validate.js`.

## 2. Consultas a base de datos
- **Siempre** sentencias preparadas con parámetros `?`. Prohibido construir SQL por
  concatenación de cadenas.
- *Por qué:* neutraliza la inyección SQL por diseño (OWASP A03).
- *Dónde:* `src/db/index.js`, `src/services/*.js`.

## 3. Salida y plantillas
- En el cliente, pintar datos de usuario con `textContent`, **nunca** `innerHTML`.
- Mantener la **CSP** sin `unsafe-inline`: el JS vive en ficheros externos.
- *Por qué:* evita XSS almacenado/reflejado (OWASP A03).
- *Dónde:* `src/public/app.js`, `src/middleware/security.js`.

## 4. Autenticación y sesión
- Contraseñas con bcrypt (coste configurable). Nunca almacenar texto plano.
- Regenerar la sesión tras login; cookies `httpOnly` + `sameSite` + `secure` en prod.
- *Dónde:* `src/services/user.service.js`, `src/app.js`, `src/routes/auth.routes.js`.

## 5. Control de acceso
- *Deny-by-default*: lo no autenticado se rechaza con 401.
- Toda consulta de tareas filtra por `req.session.userId` (jamás por un id de cliente).
- *Dónde:* `src/middleware/auth.js`, `src/services/todo.service.js`.

## 6. Gestión de secretos
- Secretos **solo** en variables de entorno / `.env` (excluido del repo). `.env.example`
  documenta las claves sin valores reales.
- En producción, la app **aborta** si `SESSION_SECRET` falta o es débil.
- *Dónde:* `src/config/index.js`, `.env.example`, `.gitignore`.

## 7. Manejo de errores y logging
- No devolver trazas ni detalles internos al cliente en producción.
- Logging estructurado con redacción de `password`, `cookie`, `authorization`.
- *Dónde:* `src/middleware/errorHandler.js`, `src/lib/logger.js`.

## 8. Dependencias y cadena de suministro
- `npm ci` con `package-lock.json` para builds reproducibles.
- `npm audit` en CI y Dependabot para parches automáticos.
- Preferir módulos integrados de Node (p. ej. `node:sqlite`, `node:crypto`) frente a
  dependencias externas cuando sea razonable.

## 9. Contenedor
- Imagen base mínima y **fijada por versión**; build multi-stage.
- Ejecutar como usuario **no-root**; `cap_drop: ALL`, `no-new-privileges`, rootfs
  `read_only`. *Dónde:* `Dockerfile`, `docker-compose.yml`.
