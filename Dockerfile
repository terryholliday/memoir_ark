# Stage 1: Client Build
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --legacy-peer-deps
COPY client/ .
RUN npm run build

# Stage 2: Server Build & Runtime
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
# Copy built client assets to where Express expects them
COPY --from=client-builder /app/client/dist ./client/dist

# Build server (TypeScript)
RUN npm run build

ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/index.js"]
