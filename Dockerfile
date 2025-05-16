# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy only package.json and lock file to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app files
COPY . .

# Set environment variable
ENV NODE_ENV=production

# Expose the port
EXPOSE 5050

# Run the app
CMD ["npm", "start"]
