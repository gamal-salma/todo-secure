# syntax=docker/dockerfile:1

###############################################################################
# Dockerfile multi-stage del to-do seguro.
#
# Decisiones de seguridad (S-SDLC: Despliegue / Cadena de suministro):
#  * Imagen base "alpine" minima y version FIJADA por etiqueta -> menor superficie
#    de ataque y builds reproducibles (NIST SSDF PW.4 / PS.3; OWASP A06:2021).
#  * Stage de dependencias separado con "npm ci --omit=dev" -> solo dependencias de
#    produccion en la imagen final, sin herramientas de build ni devDeps.
#  * Ejecucion como usuario NO root (node) -> principio de minimo privilegio.
#  * HEALTHCHECK para que el orquestador detecte el estado real del servicio.
###############################################################################

# ---- Stage 1: dependencias de produccion ----
FROM node:25-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ---- Stage 2: runtime ----
FROM node:25-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Copiamos dependencias ya instaladas y el codigo de la aplicacion.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

# Directorio de datos para el fichero SQLite, propiedad del usuario no privilegiado.
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/server.js"]
