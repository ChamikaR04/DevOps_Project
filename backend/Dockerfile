# -----------------------------
# Build stage
# -----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Required to build native dependencies such as bcrypt
RUN apk add --no-cache python3 make g++

# Copy dependency files first for better Docker layer caching
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Rebuild bcrypt for the Alpine Linux environment
RUN npm rebuild bcrypt --build-from-source

# Copy application source
COPY . .


# -----------------------------
# Production stage
# -----------------------------
FROM node:20-alpine

WORKDIR /app

# Copy only the application and production dependencies
COPY --from=builder /app ./

# npm is not required to run the application
RUN rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/bin/npm \
           /usr/local/bin/npx

EXPOSE 4000

CMD ["node", "server.js"]