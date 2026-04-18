# Use Node.js 20 base image
FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the frontend
RUN npm run build

# Expose the port (Cloud Run uses $PORT)
EXPOSE 8080

# Start the server
CMD [ "npm", "start" ]
