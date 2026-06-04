# Ejecución del S-SDLC en el To-Do Seguro

Este documento describe, **fase a fase**, cómo se ha construido la aplicación
aplicando un Ciclo de Vida de Desarrollo Seguro (S-SDLC). Para cada fase se indican
las **actividades de seguridad**, los **marcos de referencia** que las respaldan y los
**artefactos concretos** de este repositorio que las materializan.

> Marcos aplicados de forma transversal: **Microsoft SDL**, **OWASP SAMM v2**,
> **NIST SSDF (SP 800-218)**, **OWASP Top 10 (2021)** y **OWASP ASVS v4**.

---

## Fase 0 — Punto de partida (reutilización)

Se parte de la aplicación **"to-do"** del tutorial oficial de Docker
(<https://docs.docker.com/get-started/>), una web-app de lista de tareas. Se elige una
**web-app** (y no una CLI) porque las unidades posteriores de la asignatura (3, 4 y 5)
reutilizarán esta misma aplicación, y una superficie web permite ejercitar controles
más ricos (sesiones, cabeceras, CSRF, CSP…).

A partir de esa referencia se reconstruye la aplicación con una arquitectura limpia y
controles de seguridad integrados desde el primer commit ("security by design").

---

## Fase 1 — Requisitos (Requirements)

**Objetivo:** definir requisitos funcionales y, sobre todo, **requisitos de seguridad**
antes de escribir código.

- **Actividades:**
  - Definición de requisitos de seguridad alineados con **OWASP ASVS** (nivel 1–2):
    autenticación, gestión de sesión, control de acceso, validación, registro.
  - Selección de estándares (SDL, SSDF *Prepare the Organization*).
- **NIST SSDF:** `PO.1` (definir requisitos de seguridad), `PO.3` (cadena de
  herramientas).
- **Artefactos:** [`docs/security-requirements.md`](./security-requirements.md),
  [`security/owasp-asvs-mapping.md`](../security/owasp-asvs-mapping.md).

---

## Fase 2 — Diseño (Design)

**Objetivo:** diseñar la arquitectura y **modelar amenazas** antes de implementar.

- **Actividades:**
  - **Threat modeling STRIDE** sobre el DFD del to-do (entidades, procesos, almacén,
    límites de confianza).
  - Decisiones de diseño seguro: separación `app.js` (fábrica) / `server.js`
    (arranque), capa de servicios, política *deny-by-default*, propiedad de los datos
    por `user_id` (anti-IDOR).
- **Microsoft SDL:** práctica de *Threat Modeling*. **OWASP SAMM:** *Design > Threat
  Assessment*. **NIST SSDF:** `PW.1` (diseño que cumple requisitos de seguridad).
- **OWASP Top 10:** A01 (Broken Access Control), A04 (Insecure Design).
- **Artefactos:** [`docs/threat-model.md`](./threat-model.md),
  [`docs/architecture.md`](./architecture.md), diagramas en `docs/diagrams/`.

---

## Fase 3 — Implementación (Implementation)

**Objetivo:** codificar de forma segura aplicando las mitigaciones del modelo de
amenazas.

- **Actividades y controles concretos:**
  - **Validación de entrada** estricta (allow-list) → `src/middleware/validate.js`.
  - **Consultas parametrizadas** (anti-SQLi) → `src/db/`, `src/services/`.
  - **Hashing** de contraseñas con bcrypt → `src/services/user.service.js`.
  - **Gestión de sesión** endurecida y anti-fixation → `src/app.js`, `auth.routes.js`.
  - **CSRF** synchronizer token → `src/middleware/csrf.js`.
  - **Cabeceras seguras + CSP** → `src/middleware/security.js`.
  - **Gestión de secretos** por variables de entorno → `src/config/index.js`, `.env.example`.
  - **Logging** con redacción de datos sensibles → `src/lib/logger.js`.
- **NIST SSDF:** `PW.4` (reutilizar componentes seguros), `PW.5` (codificación segura),
  `PW.7` (revisión de código), `PS.1` (proteger secretos).
- **OWASP Top 10:** A02, A03, A05, A07.
- **Artefactos:** [`security/secure-coding-guidelines.md`](../security/secure-coding-guidelines.md).

---

## Fase 4 — Pruebas (Verification)

**Objetivo:** verificar que los controles funcionan.

- **Actividades:**
  - **Pruebas unitarias / de integración** del CRUD y la autenticación.
  - **Pruebas de seguridad** automatizadas (cabeceras, 401 sin sesión, IDOR, CSRF,
    SQLi, XSS, rate limiting) → `tests/security.test.js`.
  - **SCA**: `npm audit` para dependencias vulnerables.
- **Microsoft SDL:** *Security Testing*. **OWASP SAMM:** *Verification*. **NIST SSDF:**
  `PW.8` (pruebas), `RV.1` (identificar vulnerabilidades).
- **Artefactos:** carpeta `tests/`, job de CI en `.github/workflows/ci.yml`,
  evidencias de ejecución en `docs/evidencias/` (15/15 pruebas en verde, cabeceras reales).

---

## Fase 5 — Despliegue (Release / Deployment)

**Objetivo:** empaquetar y desplegar de forma segura y reproducible.

- **Actividades:**
  - **Contenerización endurecida**: imagen base mínima y fijada, build multi-stage,
    usuario **no-root**, `cap_drop: ALL`, `no-new-privileges`, rootfs `read_only`,
    `HEALTHCHECK`.
  - **Gestión de configuración/secretos** vía `.env` (excluido del repo) y
    `docker-compose`.
  - **Pipeline CI** que ejecuta lint, tests, auditoría y build de imagen.
- **NIST SSDF:** `PS.1`/`PS.2` (proteger software y procedencia), `PW.6` (configuración
  de compilación segura). **OWASP Top 10:** A05 (misconfiguration), A06 (componentes
  vulnerables).
- **Artefactos:** `Dockerfile`, `docker-compose.yml`, `.dockerignore`,
  `.github/workflows/ci.yml`, `.github/dependabot.yml`.

---

## Fase 6 — Operación y Mantenimiento (Operation / Maintenance)

**Objetivo:** mantener la seguridad a lo largo del tiempo.

- **Actividades:**
  - **Monitorización**: logs estructurados + `HEALTHCHECK`.
  - **Gestión de vulnerabilidades y parches**: Dependabot + `npm audit` en CI.
  - **Divulgación responsable**: proceso documentado en `SECURITY.md`.
  - **Apagado controlado** (graceful shutdown) → `src/server.js`.
- **NIST SSDF:** `RV.1`/`RV.2`/`RV.3` (identificar, evaluar y remediar
  vulnerabilidades). **OWASP SAMM:** *Operations*.
- **Artefactos:** `SECURITY.md`, `.github/dependabot.yml`, `src/lib/logger.js`.

---

## Resumen de trazabilidad fase → artefacto

| Fase S-SDLC | Artefacto principal en el repo |
|-------------|-------------------------------|
| Requisitos | `docs/security-requirements.md`, `security/owasp-asvs-mapping.md` |
| Diseño | `docs/threat-model.md`, `docs/architecture.md`, `docs/diagrams/` |
| Implementación | `src/` + `security/secure-coding-guidelines.md` |
| Pruebas | `tests/`, `.github/workflows/ci.yml` |
| Despliegue | `Dockerfile`, `docker-compose.yml`, `.dockerignore` |
| Operación | `SECURITY.md`, `.github/dependabot.yml`, logging |
