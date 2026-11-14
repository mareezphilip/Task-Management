FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN HUSKY=0 npm ci

COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine AS web

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/task-management-dashboard/browser /usr/share/nginx/html

EXPOSE 80

FROM node:22-alpine AS api

ENV NODE_ENV=production \
    API_PORT=3001

WORKDIR /app

COPY --chown=node:node data-fetching/server.js ./data-fetching/server.js
COPY --chown=node:node public/data-fetching ./public/data-fetching

USER node

EXPOSE 3001

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3001/api/tasks').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "data-fetching/server.js"]
