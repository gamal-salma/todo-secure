# Mapeo OWASP ASVS v4 y OWASP Top 10 (2021) → To-Do Seguro

## OWASP Top 10 (2021)

| Riesgo | ¿Aplica? | Mitigación en el to-do | Prueba |
|--------|----------|------------------------|--------|
| A01 Broken Access Control | Sí | `requireAuth` deny-by-default + filtro `user_id` (anti-IDOR) | `security.test.js` |
| A02 Cryptographic Failures | Sí | bcrypt para contraseñas; cookie firmada; HSTS en prod | — |
| A03 Injection | Sí | Sentencias preparadas (SQLi) + validación + `textContent`/CSP (XSS) | `security.test.js` |
| A04 Insecure Design | Sí | Threat modeling STRIDE en diseño; arquitectura por capas | `docs/threat-model.md` |
| A05 Security Misconfiguration | Sí | Helmet/CSP, `x-powered-by` off, errores sin detalle, contenedor endurecido | `security.test.js` |
| A06 Vulnerable Components | Sí | `npm audit` + Dependabot + lockfile + base fijada | CI |
| A07 Identification & Auth Failures | Sí | Rate limiting login, anti-fixation, anti-enumeración | `security.test.js` |
| A08 Software & Data Integrity | Parcial | `npm ci` con lockfile, build reproducible | CI |
| A09 Logging & Monitoring Failures | Sí | Logging estructurado + `reqId` + healthcheck | — |
| A10 SSRF | No aplica | La app no realiza peticiones salientes a URLs controladas por el usuario | — |

## OWASP ASVS v4 — capítulos cubiertos (nivel 1–2)

| Capítulo ASVS | Requisito representativo | Implementación |
|---------------|--------------------------|----------------|
| V2 Authentication | V2.1 (credenciales), V2.2 (anti-brute force), V2.4 (almacenamiento) | `user.service.js`, `validate.js`, `rateLimit.js` |
| V3 Session Management | V3.2 (regeneración), V3.4 (atributos de cookie) | `auth.routes.js`, `app.js` |
| V4 Access Control | V4.1 (deny by default), V4.2 (anti-IDOR/CSRF) | `auth.js`, `todo.service.js`, `csrf.js` |
| V5 Validation/Encoding | V5.1 (validación), V5.3 (inyección/XSS) | `validate.js`, `db`, `public/app.js` |
| V7 Error/Logging | V7.1/V7.3 (logs sin datos sensibles), V7.4 (errores) | `logger.js`, `errorHandler.js` |
| V9 Communications | V9.1 (HSTS/TLS en prod) | `security.js` (HSTS), proxy TLS |
| V13 API | V13.x (límites, métodos) | body limit 16kB, rutas REST explícitas |
| V14 Configuration | V14.1/V14.4 (cabeceras, config segura) | `security.js`, `config`, contenedor |
