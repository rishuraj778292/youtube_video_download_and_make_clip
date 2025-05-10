
# Use a base image with Node.js and Python
FROM node:18-bullseye

# Install Python, pip, and ffmpeg only (yt-dlp removed)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg

# Upgrade pip
RUN python3 -m pip install --upgrade pip

# Set working directory
WORKDIR /app

# Copy app files
COPY . .

# Install Node dependencies
RUN npm install

# Expose your app's port
EXPOSE 8800

# Start your app
CMD ["npm", "start"]
