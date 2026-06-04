# Requisitos de seguridad — To-Do Seguro

Requisitos definidos en la fase de **Requisitos** del S-SDLC, alineados con
**OWASP ASVS v4** (niveles 1–2) y **NIST SSDF PO.1**. Cada requisito es verificable y
está trazado a su implementación y, cuando aplica, a la prueba que lo cubre.

| ID | Requisito de seguridad | ASVS | Implementación | Verificado en |
|----|------------------------|------|----------------|---------------|
| RS-01 | Las contraseñas se almacenan con hash adaptativo y sal | V2.4.1 | bcrypt coste 12 (`user.service.js`) | — |
| RS-02 | Política mínima de credenciales (longitud 8–128) | V2.1.1 | `validate.js` | `auth.test.js` |
| RS-03 | Mensajes de autenticación que no permiten enumerar usuarios | V2.2.1 | error genérico + compare constante (`user.service.js`) | `auth.test.js` |
| RS-04 | Protección contra fuerza bruta en autenticación | V2.2.1 | rate limiting `/api/auth` | `security.test.js` |
| RS-05 | Regeneración del id de sesión tras autenticarse | V3.2.1 | `req.session.regenerate` (`auth.routes.js`) | — |
| RS-06 | Cookies de sesión `httpOnly`, `sameSite` y `secure` en prod | V3.4.x | `app.js` | `security.test.js` |
| RS-07 | Control de acceso *deny-by-default* en recursos protegidos | V4.1.1 | `requireAuth` | `security.test.js` |
| RS-08 | Un usuario solo accede a sus propios recursos (anti-IDOR) | V4.2.1 | filtro `user_id` (`todo.service.js`) | `security.test.js` |
| RS-09 | Validación de toda entrada en el límite de confianza | V5.1.x | `validate.js` | `todos.test.js` |
| RS-10 | Prevención de inyección SQL | V5.3.4 | sentencias preparadas (`db`, `services`) | `security.test.js` |
| RS-11 | Prevención de XSS (salida segura + CSP) | V5.3.3 / V14.4.3 | `textContent` + CSP (`security.js`) | `security.test.js` |
| RS-12 | Protección CSRF en operaciones que cambian estado | V4.2.2 | synchronizer token (`csrf.js`) | `security.test.js` |
| RS-13 | Cabeceras de seguridad HTTP | V14.4.x | Helmet (`security.js`) | `security.test.js` |
| RS-14 | Registro de eventos de seguridad sin filtrar datos sensibles | V7.1 / V7.3 | pino + redacción (`logger.js`) | — |
| RS-15 | No divulgar detalles internos en errores | V7.4.1 | `errorHandler.js` | — |
| RS-16 | Gestión de secretos fuera del código fuente | V14.1 (config) | `.env` + `config` fail-fast | — |
| RS-17 | Límite de tamaño de petición (anti-DoS) | V13.x | body parser 16kB (`app.js`) | — |
| RS-18 | Ejecución con mínimo privilegio en el contenedor | V14.x | no-root, cap_drop, read_only (`Dockerfile`/compose) | — |
