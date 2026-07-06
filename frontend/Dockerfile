# Frontend: Vite 6 build served as static files by nginx.
#
# IMPORTANT: VITE_API_BASE_URL is resolved at BUILD time (Vite inlines
# import.meta.env into the bundle). The default below ("/api") is relative,
# so the compiled app calls the same origin it is served from and nginx
# proxies /api to the backend. Override it only if you serve the API from a
# different absolute URL, e.g.:
#   docker build --build-arg VITE_API_BASE_URL=https://api.example.com/api .

# ---- Build stage ----
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
# SPA + /api proxy config.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
# nginx:alpine already runs `nginx -g 'daemon off;'` as its CMD.
