# Use a base image with Node.js and Python
FROM node:18-bullseye

# Install Python, pip, and ffmpeg with necessary libraries
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    libfdk-aac-dev \
    libx264-dev \
    libvpx-dev \
    libmp3lame-dev \
    libopus-dev \
    libx265-dev \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN python3 -m pip install --upgrade pip

# Set working directory
WORKDIR /app

# Create the clips directory inside the container
RUN mkdir -p /app/clips

# Copy app files
COPY . .

# Install Node dependencies
RUN npm install

# Expose your app's port
EXPOSE 8800

# Start your app
CMD ["npm", "start"]
