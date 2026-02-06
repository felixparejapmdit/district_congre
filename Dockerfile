# Stage 1: Build React
FROM node:20-alpine AS build-stage
WORKDIR /app

# Pass the API URL from docker-compose/env during build time
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine
# Copy the built files from Stage 1
COPY --from=build-stage /app/build /usr/share/nginx/html
# Use the config file
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]