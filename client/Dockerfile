FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
# Add custom nginx config to handle SPA routing if needed
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
