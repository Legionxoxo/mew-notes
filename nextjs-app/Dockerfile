# Use official Node.js Alpine base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose port for dev server
EXPOSE 3000

# Run the development server
CMD ["npm", "run", "dev"]
