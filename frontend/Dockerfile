# 1) Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copiar package*.json e instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el resto y compilar
COPY . .
RUN npm run build

# 2) Runtime stage
FROM node:20-alpine AS runtime
WORKDIR /app

# Copiar solo lo necesario
COPY --from=builder /app/build build
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/package.json .

# Exponer el puerto que SvelteKit usa por defecto (4173 en preview, 3000 en node)
# Vite preview usa 4173; en producción SvelteKit escucha en 3000
EXPOSE 3000

# Arrancar el servidor generado
CMD ["node", "build"]