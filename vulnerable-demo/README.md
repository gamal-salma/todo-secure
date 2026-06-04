# ⚠️ vulnerable-demo — App deliberadamente insegura (Unidad 4)

> **AVISO:** todo el contenido de esta carpeta es **inseguro a propósito**. Sirve
> únicamente para que las herramientas de análisis de seguridad generen alertas y poder
> documentar sus reportes (Actividad de la Unidad 4). **No ejecutar ni desplegar.**
> La aplicación **segura y correcta** es la del repositorio (`../src/`).

## Vulnerabilidades introducidas a propósito

| Fichero | Vulnerabilidad | OWASP / CWE | Herramienta que la detecta |
|---------|----------------|-------------|----------------------------|
| `insecure-app.js` | SQL injection por concatenación | A03 / CWE-89 | Semgrep, CodeQL |
| `insecure-app.js` | `eval()` sobre entrada del usuario | A03 / CWE-95 | ESLint security, Semgrep |
| `insecure-app.js` | Command injection (`child_process.exec`) | A03 / CWE-78 | ESLint security |
| `insecure-app.js` | Hash débil MD5 | A02 / CWE-327 | Semgrep |
| `insecure-app.js` | Aleatoriedad insegura (`Math.random`) | A02 / CWE-330 | Semgrep |
| `insecure-app.js` | Secretos hardcodeados (AWS, sesión, BD) | A05 / CWE-798 | gitleaks, Semgrep |
| `insecure-app.js` | Cookie de sesión insegura | A05 / CWE-614 | revisión / ZAP |
| `insecure-frontend.js` | XSS por `innerHTML` y `document.write` | A03 / CWE-79 | Semgrep (regla propia) |
| `Dockerfile` | Imagen `latest`, root, `ADD` remoto, secreto en `ENV` | A05 / CWE-250/1104/798 | Trivy (config) |
| `package.json` | Dependencias con CVE conocidos | A06 | npm audit, Trivy, Dependabot |

Ver el informe completo con los resultados reales en
[`../docs/informe-herramientas.md`](../docs/informe-herramientas.md).
