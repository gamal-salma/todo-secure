# Política de seguridad

## Versiones soportadas

| Versión | Soportada |
|---------|-----------|
| 1.0.x   | ✅        |

## Cómo reportar una vulnerabilidad

Si descubres una vulnerabilidad de seguridad en **To-Do Seguro**:

1. **No** abras un *issue* público ni un *pull request* que la describa.
2. Envía los detalles por correo a **security@todo-secure.example** (canal privado de
   divulgación responsable).
3. Incluye: descripción, pasos de reproducción, impacto estimado y, si es posible, una
   prueba de concepto.

Compromisos de respuesta (divulgación responsable / NIST SSDF RV):

- **Acuse de recibo:** en un máximo de 72 horas.
- **Evaluación y triaje:** en un máximo de 7 días naturales.
- **Resolución:** según severidad (CVSS); las críticas se priorizan.
- Se reconocerá públicamente al investigador, salvo que prefiera el anonimato.

## Prácticas de seguridad del proyecto

- Modelado de amenazas STRIDE: ver [`docs/threat-model.md`](./docs/threat-model.md).
- Pruebas de seguridad automatizadas: `tests/security.test.js`.
- Análisis de dependencias: `npm audit` en CI + Dependabot.
- Escaneo de secretos: `security/.gitleaks.toml`.

## Limitaciones conocidas (riesgos aceptados)

- **Almacén de sesiones en memoria (`MemoryStore`)**: la configuración por defecto de
  `express-session` no es apta para producción multi-proceso (no escala y puede perder
  sesiones). Para un despliegue real, sustituir por un almacén persistente como Redis
  (`connect-redis`). Es una decisión consciente para mantener la demo sin servicios
  adicionales.
- **Terminación TLS externa**: la aplicación marca las cookies como `secure` y activa
  HSTS en producción, pero **no** termina TLS por sí misma; debe situarse tras un proxy
  inverso (Nginx/Traefik) o una plataforma que aporte HTTPS, y fijar `TRUST_PROXY=1`.
- **SQLite**: adecuado para un único contenedor; para alta concurrencia/escala
  horizontal se migraría a PostgreSQL.

## Gestión de secretos

- Los secretos se gestionan **exclusivamente** mediante variables de entorno / `.env`,
  que está excluido del control de versiones (`.gitignore`).
- `.env.example` documenta las variables necesarias **sin** valores reales.
- En producción, la aplicación **aborta el arranque** si `SESSION_SECRET` no está
  definido o es demasiado corto (ver `src/config/index.js`).
