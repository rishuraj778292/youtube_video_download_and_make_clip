# Stage 1: Build the Node.js application
FROM node:18-bullseye AS build

# Set working directory
WORKDIR /app

# Install Python and required libraries
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    wget \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Copy package.json and install dependencies
COPY package*.json ./ 
RUN npm install

# Copy the rest of the application
COPY . .

# Stage 2: Use Node.js as base and install FFmpeg
FROM node:18-slim AS runtime

# Set working directory for runtime
WORKDIR /app

# Install FFmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy only the necessary artifacts from the build stage
COPY --from=build /app /app

# Expose the port your app is running on
EXPOSE 8800

# Start the Node.js application
CMD ["npm", "start"]