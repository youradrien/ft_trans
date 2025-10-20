# 1: build
FROM node:24 AS builder

WORKDIR /app

COPY . .

RUN npm install
RUN npm run build

# 2: serve with nginx
FROM nginx:alpine
# FROM owasp/modsecurity-crs:3.3.7-nginx-202510030310

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]