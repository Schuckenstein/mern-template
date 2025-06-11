version: '3.8'

services:
  mongodb:
    image: mongo:7.0
    container_name: mern-template-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: mern_template
    volumes:
      - mongodb_data:/data/db
      - ./server/prisma/seed.js:/docker-entrypoint-initdb.d/seed.js:ro
    networks:
      - mern-network

  redis:
    image: redis:7.2-alpine
    container_name: mern-template-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - mern-network

  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: mern-template-server
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      PORT: 5000
      DATABASE_URL: mongodb://admin:password@mongodb:27017/mern_template?authSource=admin
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-super-secret-jwt-key-change-in-production
      JWT_REFRESH_SECRET: your-super-secret-refresh-key-change-in-production
      CLIENT_URL: http://localhost:3000
    volumes:
      - ./server:/app
      - /app/node_modules
      - ./server/uploads:/app/uploads
    depends_on:
      - mongodb
      - redis
    networks:
      - mern-network
    command: npm run dev

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: mern-template-client
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:5000/api
      VITE_DEBUG_URL: http://localhost:8080
    volumes:
      - ./client:/app
      - /app/node_modules
    depends_on:
      - server
    networks:
      - mern-network
    command: npm run dev

  debug-dashboard:
    image: nginx:alpine
    container_name: mern-template-debug
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./debug-dashboard:/usr/share/nginx/html:ro
    networks:
      - mern-network

volumes:
  mongodb_data:
  redis_data:

networks:
  mern-network:
    driver: bridge