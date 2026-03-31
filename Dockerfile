# Stage 1: Build the Vite app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Debug + Build
RUN echo "=== VITE Environment Variables ===" && \
    env | grep VITE_ || echo "No VITE_ variables found" && \
    echo "=== Running build ===" && \
    npm run build

# Stage 2: Serve with Nginx + SPA routing
FROM nginx:alpine

# Copy custom nginx config for React Router / Vite SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the built files (Vite default output directory is "dist")
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80