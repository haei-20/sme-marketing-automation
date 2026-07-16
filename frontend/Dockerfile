# syntax=docker/dockerfile:1

FROM node:24-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Vite thay thế các biến VITE_* tại thời điểm build. Không đặt bí mật ở đây.
ARG VITE_API_BASE_URL
ARG VITE_WS_URL=ws://localhost:8080/ws
ARG VITE_USE_MOCKS=false
ARG VITE_API_TIMEOUT_MS=20000
ARG VITE_WS_RECONNECT_DELAY_MS=3000

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_WS_URL=${VITE_WS_URL} \
    VITE_USE_MOCKS=${VITE_USE_MOCKS} \
    VITE_API_TIMEOUT_MS=${VITE_API_TIMEOUT_MS} \
    VITE_WS_RECONNECT_DELAY_MS=${VITE_WS_RECONNECT_DELAY_MS}

COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/healthz | grep -q '^ok$' || exit 1

CMD ["nginx", "-g", "daemon off;"]
