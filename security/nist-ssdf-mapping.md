# Mapeo NIST SSDF (SP 800-218) → To-Do Seguro

El **Secure Software Development Framework** de NIST (SP 800-218) organiza las prácticas
en cuatro grupos: **PO** (Prepare the Organization), **PS** (Protect the Software),
**PW** (Produce Well-Secured Software) y **RV** (Respond to Vulnerabilities). Tabla de
cómo este repositorio satisface las prácticas aplicables a un proyecto individual.

| Práctica SSDF | Descripción | Evidencia en el repositorio |
|---------------|-------------|-----------------------------|
| **PO.1** | Definir requisitos de seguridad del software | `docs/security-requirements.md` |
| **PO.3** | Establecer la cadena de herramientas (toolchain) | CI (`.github/workflows/ci.yml`), `npm audit`, Dependabot |
| **PO.5** | Configurar entornos seguros | Contenedor endurecido, separación de config por entorno (`src/config`) |
| **PS.1** | Proteger el código y los **secretos** del acceso no autorizado | `.env` fuera del repo, `.gitignore`, escaneo `security/.gitleaks.toml` |
| **PS.2** | Mantener la procedencia del software | `package-lock.json`, imagen base fijada, build multi-stage |
| **PS.3** | Archivar y proteger cada versión | Etiquetado de imagen `todo-secure:1.0.0`, `engines` fijado |
| **PW.1** | Diseñar el software cumpliendo requisitos de seguridad | `docs/threat-model.md`, `docs/architecture.md` |
| **PW.4** | Reutilizar componentes seguros bien mantenidos | Helmet, express-validator, bcryptjs; módulos `node:` integrados |
| **PW.5** | Crear el código siguiendo prácticas seguras | `security/secure-coding-guidelines.md`, código en `src/` |
| **PW.6** | Configurar compilación/empaquetado seguro | `Dockerfile` multi-stage no-root, `.dockerignore` |
| **PW.7** | Revisar y/o analizar el código | Revisión por PR (`CONTRIBUTING.md`, CODEOWNERS), lint en CI |
| **PW.8** | Probar el código (funcional y de seguridad) | `tests/` (incl. `security.test.js`) ejecutados en CI |
| **RV.1** | Identificar vulnerabilidades de forma continua | `npm audit` en CI, Dependabot |
| **RV.2** | Evaluar, priorizar y remediar | `SECURITY.md` (proceso), umbral `--audit-level=high` |
| **RV.3** | Analizar causas raíz para evitar recurrencia | Documentado como práctica en `SECURITY.md` |
