# Use Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN apk add --no-cache curl
RUN npm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start command
CMD ["npm", "start"]
