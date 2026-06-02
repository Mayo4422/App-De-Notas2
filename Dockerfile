# ── Etapa 1: Build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

# Instalar dependencias del sistema
RUN apk add --no-cache git

WORKDIR /app

# Copiar archivos de dependencias primero (cache layer)
COPY package*.json ./

# Instalar dependencias
RUN npm install --legacy-peer-deps

# Copiar código fuente
COPY . .

# ── Etapa 2: Runtime ────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Solo copiar lo necesario del builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/src ./src
COPY --from=builder /app/app.config.ts ./
COPY --from=builder /app/babel.config.js ./
COPY --from=builder /app/tsconfig.json ./

# Usuario no-root por seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Exponer puerto de Expo
EXPOSE 8081

# Variables de entorno (sin valores hardcodeados)
ENV NODE_ENV=production
ENV EXPO_NO_DOTENV=1

# Comando de inicio
CMD ["npx", "expo", "start", "--no-dev", "--minify"]