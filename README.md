<p align="center">
  <img src="assets/ue-logo.svg" alt="Universidad Europea" height="72" />
</p>

<h1 align="center">To-Do Seguro — Evaluación con herramientas automáticas</h1>

<p align="center">
  Continuación del proyecto to-do (S-SDLC + DevSecOps), ahora <strong>evaluado con más de
  cinco herramientas de seguridad</strong> e introduciendo vulnerabilidades a propósito
  para observar sus alertas.
</p>

<p align="center">
  <strong>Asignatura:</strong> Metodologías de Desarrollo Seguro ·
  Grado en Ingeniería de la Ciberseguridad<br/>
  <strong>Universidad Europea de Madrid</strong> · Curso 2025/2026 ·
  <strong>Unidad 4 (Actividad 3)</strong><br/>
  <strong>Estudiante:</strong> Salma Gamal · <strong>Profesor:</strong> Sergio Iglesias Pérez
</p>

---

## Autoría y continuidad

- **Trabajo individual** realizado por **Salma Gamal**.
- Esta entrega **continúa y extiende** las actividades anteriores:
  - Actividad 1 (Unidad 2): app to-do segura siguiendo el S-SDLC.
  - Actividad 2 (Unidad 3): incorporación de DevSecOps (pipeline de seguridad como código).
  - **Actividad 3 (Unidad 4):** evaluación con herramientas automáticas (este documento).
- 🔗 Repositorio: **<https://github.com/gamal-salma/todo-secure>**
  (historial con etiquetas `actividad-1`, `actividad-2`, `actividad-3`).

> La aplicación segura y su ejecución se documentan en el resto del repositorio
> (`docs/`). Esta actividad se centra en su **evaluación**.

---

## 1. Herramientas/técnicas seleccionadas y por qué

Se han ejecutado **6 técnicas** de categorías distintas:

| Técnica | Herramienta | Por qué |
|---------|-------------|---------|
| **SCA** (dependencias) | `npm audit` · Dependabot | La app depende de npm; detectar CVEs es prioritario (A06). |
| **SAST** (estático) | ESLint security · **Semgrep** · **CodeQL** | Patrones peligrosos: eval, child_process, SQLi, XSS, secretos. |
| **Secret scanning** | gitleaks · *secret scanning* de GitHub | La app maneja secretos; evitar fugas (A05/PS.1). |
| **Contenedor / IaC** | **Trivy** | Se entrega como contenedor: imagen + configuración (A05/A06). |
| **DAST** (dinámico) | **OWASP ZAP** baseline | Valida cabeceras y cookies en caliente (A05). |

Detalle y justificación completa en [`docs/informe-herramientas.md`](docs/informe-herramientas.md).

---

## 2. Resultados de la evaluación (reales)

Para provocar alertas se creó una copia **deliberadamente vulnerable** en
[`vulnerable-demo/`](vulnerable-demo/) (la app segura `src/` no se modifica).

![Resultados de las herramientas](docs/evidencias-herramientas/resultados-herramientas.png)

| Herramienta | Resultado real |
|-------------|----------------|
| **npm audit** (SCA) | **15 vulnerabilidades** (2 críticas, 8 altas, 1 moderada, 4 bajas) |
| **ESLint security** (SAST) | 3 hallazgos: `eval` (x2), `child_process` |
| **gitleaks** (secretos) | 2 secretos: GitHub PAT y Stripe token |
| **Trivy** (IaC/contenedor) | 4 *misconfigurations* (1 crítica, 1 alta, 1 media, 1 baja) |
| **Semgrep / CodeQL** (SAST, CI) | SQLi por concatenación y XSS por `innerHTML` |
| **OWASP ZAP** (DAST, CI) | Cabeceras/cookies inseguras |

Salidas completas en [`docs/evidencias-herramientas/`](docs/evidencias-herramientas/).

---

## 3. Alteraciones introducidas (para disparar las alertas)

| Alteración | Efecto buscado | Detectado por | OWASP/CWE |
|------------|----------------|---------------|-----------|
| SQL por concatenación | SQLi | Semgrep, CodeQL | A03/CWE-89 |
| `eval()` con entrada | RCE | ESLint, Semgrep | A03/CWE-95 |
| `child_process.exec` con input | Command injection | ESLint | A03/CWE-78 |
| Secretos hardcodeados | Fuga de credenciales | gitleaks, Trivy | A05/CWE-798 |
| `innerHTML` / `document.write` | XSS | Semgrep (regla propia) | A03/CWE-79 |
| MD5 / `Math.random` | Cripto débil | Semgrep | A02/CWE-327/330 |
| Dockerfile `latest`, root, secreto en ENV | Mala config | Trivy | A05/CWE-250/798 |
| Dependencias con CVE | Componentes vulnerables | npm audit, Dependabot | A06 |

Lista completa con fichero/línea, justificación y **remediación** en
[`docs/informe-herramientas.md`](docs/informe-herramientas.md) y
[`vulnerable-demo/README.md`](vulnerable-demo/README.md).

---

## 4. Cómo reproducir la evaluación

```bash
# SAST (app segura): debe salir limpio
npm install && npm run lint

# SCA de las dependencias vulnerables de la demo
cd vulnerable-demo && npm install && npm audit

# SAST sobre la demo insegura
npx eslint -c vulnerable-demo/eslint-demo.config.js vulnerable-demo/*.js

# Secretos
gitleaks dir vulnerable-demo --config security/.gitleaks.toml -v

# Contenedor / IaC
trivy config vulnerable-demo/
```

En GitHub, **CodeQL**, **Dependabot** y **secret scanning** corren automáticamente; el
pipeline `.github/workflows/security.yml` ejecuta además **Semgrep**, **Trivy** y **ZAP**.

---

## 5. Declaración de uso de IA

Para esta entrega se utilizó un asistente de IA (**Claude, de Anthropic**) como apoyo,
bajo supervisión y revisión humana.

**Generado con apoyo de IA:** la app `vulnerable-demo/` con las vulnerabilidades de
ejemplo, los comandos de ejecución de las herramientas, el informe y este README.

**Revisado y validado (supervisión humana):**
- Las herramientas se **ejecutaron realmente** y sus salidas son reales (no inventadas):
  npm audit (15 vulnerabilidades), ESLint (3), gitleaks (2 secretos), Trivy (4 misconfig).
- Se verificó que la app **segura** sigue limpia (`npm run lint` y `npm test` en verde) y
  que las vulnerabilidades están **aisladas** en `vulnerable-demo/`.
- Se comprobó que cada alteración dispara la alerta esperada y se mapeó a OWASP/CWE, con su
  remediación en la versión segura.

La autora asume la responsabilidad final sobre el contenido.

---

<p align="center"><sub>
Metodologías de Desarrollo Seguro · Universidad Europea de Madrid · 2025/2026
</sub></p>
