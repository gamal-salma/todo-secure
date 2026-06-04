# Modelo de amenazas (STRIDE) — To-Do Seguro

> Metodología: **STRIDE** (Microsoft SDL, fase de Diseño). El modelado de amenazas
> se realiza sobre el *Data Flow Diagram* (DFD) de la aplicación, identificando los
> activos, los límites de confianza y, para cada elemento, las amenazas de las seis
> categorías STRIDE. Cada amenaza se asocia a una mitigación **implementada** en este
> repositorio (con referencia al fichero) o documentada como riesgo aceptado.

## 1. Activos a proteger

| Activo | Por qué importa | Impacto si se compromete |
|--------|-----------------|--------------------------|
| Credenciales de usuario (hash bcrypt) | Identidad de la cuenta | Robo de cuentas, acceso a tareas privadas |
| Cookie/identificador de sesión | Autenticación continua | Suplantación (account takeover) |
| Tareas del usuario (datos) | Información personal del usuario | Pérdida de confidencialidad/integridad |
| `SESSION_SECRET` y fichero `.env` | Firma de cookies | Falsificación de sesiones de cualquier usuario |
| Fichero SQLite (`/app/data/todo.db`) | Persistencia | Fuga o manipulación masiva de datos |

## 2. Diagrama de flujo de datos y límites de confianza

Ver `docs/diagrams/stride-dfd.png` (fuente editable: `stride-dfd.drawio`).

Elementos del DFD:
- **Entidad externa:** Navegador del usuario (no confiable).
- **Proceso:** Aplicación Node/Express (confiable, contenerizada).
- **Almacén de datos:** Base de datos SQLite.
- **Límite de confianza 1:** Navegador ↔ Servidor (Internet/HTTP).
- **Límite de confianza 2:** Proceso de la app ↔ Fichero SQLite (sistema de ficheros del contenedor).

## 3. Amenazas STRIDE y mitigaciones (adaptadas al to-do)

### S — Spoofing (Suplantación de identidad)
| Amenaza concreta | Mitigación implementada | Referencia |
|------------------|-------------------------|------------|
| Un atacante intenta hacerse pasar por otro usuario adivinando su contraseña | Hash **bcrypt** (coste 12) + **rate limiting** estricto en `/api/auth/*` (10 intentos/15 min) | `src/services/user.service.js`, `src/middleware/rateLimit.js` |
| Enumeración de usuarios a partir de mensajes/tiempos de error | Mensaje de error **idéntico** y `bcrypt.compare` ejecutado siempre (incluso si el usuario no existe) | `src/services/user.service.js` |
| Fijación de sesión (session fixation) | **Regeneración del id de sesión** tras login correcto | `src/routes/auth.routes.js` |

### T — Tampering (Manipulación de datos)
| Amenaza concreta | Mitigación implementada | Referencia |
|------------------|-------------------------|------------|
| Inyección SQL para alterar/leer la BD a través de los campos de tarea o login | **Sentencias preparadas parametrizadas** en el 100 % de las consultas | `src/db/index.js`, `src/services/*.js` |
| Manipulación de la cookie de sesión | Cookie **firmada** con `SESSION_SECRET`, `httpOnly`, `sameSite` y `secure` en prod | `src/app.js` |
| Falsificación de peticiones entre sitios (CSRF) que modifique tareas | **Token CSRF** (synchronizer token) ligado a sesión + `sameSite=lax` | `src/middleware/csrf.js` |

### R — Repudiation (Repudio)
| Amenaza concreta | Mitigación implementada | Referencia |
|------------------|-------------------------|------------|
| Un usuario niega haber realizado una acción (login, alta de tarea) | **Logging estructurado** con `reqId`, eventos de registro/login/fallo de login | `src/lib/logger.js`, `src/routes/auth.routes.js` |
| Logs manipulados/ilegibles | Logs en **JSON** ingeribles por un SIEM; redacción de secretos para evitar su borrado por "limpieza" | `src/lib/logger.js` |

### I — Information Disclosure (Divulgación de información)
| Amenaza concreta | Mitigación implementada | Referencia |
|------------------|-------------------------|------------|
| Fuga de contraseñas/cookies en los logs | **Redacción** de `password`, `cookie`, `authorization`, `set-cookie` | `src/lib/logger.js` |
| Trazas de pila o detalles internos en respuestas de error | Manejador de errores que **oculta el detalle en producción** | `src/middleware/errorHandler.js` |
| Acceso indirecto a tareas de otro usuario (IDOR) | El `user_id` **siempre** forma parte del `WHERE`; FK en el esquema | `src/services/todo.service.js`, `src/db/schema.sql` |
| Revelar el stack tecnológico | `x-powered-by` deshabilitado; cabeceras endurecidas con Helmet | `src/app.js`, `src/middleware/security.js` |

### D — Denial of Service (Denegación de servicio)
| Amenaza concreta | Mitigación implementada | Referencia |
|------------------|-------------------------|------------|
| Fuerza bruta / flooding del login | **Rate limiting** en `/api/auth/*` | `src/middleware/rateLimit.js` |
| Payloads JSON gigantes que agoten memoria | **Límite de 16 kB** en el body parser | `src/app.js` |
| Abuso general de la API | **Rate limiting** global más amplio | `src/middleware/rateLimit.js` |

### E — Elevation of Privilege (Elevación de privilegios)
| Amenaza concreta | Mitigación implementada | Referencia |
|------------------|-------------------------|------------|
| Acceso a la API sin autenticar | Middleware `requireAuth` con política **deny-by-default** | `src/middleware/auth.js` |
| Escape/abuso del contenedor | Contenedor **no-root**, `cap_drop: ALL`, `no-new-privileges`, rootfs `read_only` | `Dockerfile`, `docker-compose.yml` |
| Ejecución de scripts inyectados (XSS → tomar la sesión) | **CSP estricta** sin `unsafe-inline` + render con `textContent` + cookie `httpOnly` | `src/middleware/security.js`, `src/public/app.js` |

## 4. Riesgos aceptados / limitaciones conocidas

- **Almacén de sesiones en memoria (`MemoryStore`)**: válido para demo/desarrollo; en
  producción real debe sustituirse por un almacén persistente y distribuido (p. ej.
  Redis con `connect-redis`). Documentado en `SECURITY.md`.
- **TLS terminado fuera de la app**: la app fija `secure`/HSTS en producción, pero el
  cifrado en tránsito se delega a un proxy inverso (Nginx/Traefik) o a la plataforma.

## 5. Trazabilidad

Cada mitigación de esta tabla se valida, cuando es comprobable por API, en
`tests/security.test.js` (cabeceras, 401 sin sesión, IDOR, CSRF, SQLi, XSS, rate limit).
