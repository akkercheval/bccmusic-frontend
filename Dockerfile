# Stage 1: Build the Vite app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Copy source code
COPY . .

# Show environment and run build with more verbose output
RUN echo "=== VITE Environment Variables ===" && \
    env | grep VITE_ || echo "No VITE_ variables found" && \
    echo "=== Running build ===" && \
    npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80