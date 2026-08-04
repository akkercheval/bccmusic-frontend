# Stage 1: Build the Vite/React app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build   # Vite outputs to /app/dist by default

# Stage 2: Serve with Nginx + SPA routing
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Use the project's nginx.conf for SPA routing + API proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]