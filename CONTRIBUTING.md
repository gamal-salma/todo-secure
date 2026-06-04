# Guía de contribución — To-Do Seguro

¡Gracias por tu interés en contribuir! Este proyecto se desarrolla siguiendo un Ciclo
de Vida de Desarrollo Seguro (S-SDLC), por lo que las contribuciones deben preservar
sus garantías de seguridad.

## Requisitos previos

- Node.js **>= 22.5** (para el módulo integrado `node:sqlite`).
- Docker y Docker Compose (opcional, para ejecutar en contenedor).

## Puesta en marcha para desarrollo

```bash
cp .env.example .env          # rellena SESSION_SECRET con un valor aleatorio
npm install
npm run dev                   # arranque con recarga (node --watch)
```

## Flujo de trabajo

1. Crea una rama descriptiva: `feat/...`, `fix/...`, `docs/...`.
2. Haz cambios pequeños y atómicos, con mensajes de commit claros.
3. Asegúrate de que **todo pasa** antes de abrir el PR:
   ```bash
   npm run lint
   npm test
   npm run audit
   ```
4. Abre un *pull request* rellenando la plantilla. Será revisado por los CODEOWNERS.

## Checklist de seguridad para cada PR

Toda contribución debe respetar la
[`guía de codificación segura`](./security/secure-coding-guidelines.md):

- [ ] Las nuevas entradas de usuario se **validan** (allow-list).
- [ ] Las consultas a BD usan **sentencias preparadas** (nada de concatenar SQL).
- [ ] La salida hacia el navegador usa `textContent` (no `innerHTML`) y respeta la CSP.
- [ ] No se introducen **secretos** en el código ni en los tests.
- [ ] Las rutas que cambian estado están protegidas por **CSRF** y **autenticación**.
- [ ] Se añaden o actualizan **pruebas** (incluidas de seguridad si aplica).
- [ ] `npm audit` no introduce vulnerabilidades nuevas de severidad alta/crítica.

## Estilo de código

- JavaScript en modo `'use strict'`, CommonJS.
- Comentarios que expliquen **por qué** (especialmente las decisiones de seguridad).
- Nombres descriptivos; funciones pequeñas y con una sola responsabilidad.

## Reporte de vulnerabilidades

No abras issues públicos para fallos de seguridad. Sigue el proceso de
[`SECURITY.md`](./SECURITY.md).
