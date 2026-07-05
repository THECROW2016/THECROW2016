FROM node:20-slim

WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --build-from-source

# Copy source files
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 3000

# Set production
ENV NODE_ENV=production

# Start server
CMD ["npm", "start"]
