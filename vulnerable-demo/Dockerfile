# =============================================================================
#  Dockerfile DELIBERADAMENTE INSEGURO (Unidad 4) - NO USAR.
#  La version correcta y endurecida esta en ../Dockerfile.
#  Cada linea dispara hallazgos en Trivy (escaneo de configuracion / IaC).
# =============================================================================

# [CWE-1104] Imagen base sin fijar version (etiqueta 'latest' -> no reproducible)
FROM node:latest

# [CWE-250] Se ejecuta como root (no se crea ni se usa un usuario sin privilegios)
WORKDIR /app
COPY . .

# [CWE-829] Descarga e instala un script remoto sin verificar (ADD desde URL)
ADD https://example.com/setup.sh /tmp/setup.sh
RUN chmod +x /tmp/setup.sh

# Instala dependencias incluyendo devDependencies en la imagen de produccion
RUN npm install

# [CWE-798] Secreto incrustado como variable de entorno en la imagen
# (valor REDACTADO en GitHub por el push protection; realista en el zip)
ENV API_TOKEN="REDACTED_for_github_was_a_github_pat"

# Sin HEALTHCHECK, sin USER no-root, puerto privilegiado expuesto
EXPOSE 80
CMD ["node", "insecure-app.js"]
