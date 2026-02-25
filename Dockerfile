# Stage 1: Build the app
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
# Install dependencies
RUN npm install

COPY . .

# Build for web
# Ensure EXPO_PUBLIC_API_URL is available at build time for static generation if needed
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL

RUN npx expo export -p web

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Custom nginx config if needed (e.g. for SPA routing)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
