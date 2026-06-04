## Descripción

<!-- Qué cambia y por qué -->

## Tipo de cambio

- [ ] Bugfix
- [ ] Nueva funcionalidad
- [ ] Documentación
- [ ] Refactor / mantenimiento

## Checklist de seguridad (S-SDLC)

- [ ] Las entradas de usuario se validan (allow-list).
- [ ] Las consultas a BD usan sentencias preparadas.
- [ ] La salida al navegador es segura (`textContent`, respeta la CSP).
- [ ] No se añaden secretos al repositorio.
- [ ] Rutas que cambian estado protegidas por CSRF + autenticación.
- [ ] Se añadieron/actualizaron pruebas (`npm test` en verde).
- [ ] `npm audit` sin nuevas vulnerabilidades altas/críticas.

## Cómo se ha probado

<!-- Comandos ejecutados y resultado -->
