# Use latest Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy all files
COPY . .

# Expose port
EXPOSE 5050

# Start the app using PM2
# CMD ["pm2-runtime", "ecosystem.config.js"]

CMD ["node", "index.js"]
