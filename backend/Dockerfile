# Use Node.js base image
FROM node:18

# Install Python, pip, and ffmpeg
RUN apt-get update && apt-get install -y \
    python3 python3-pip ffmpeg

# Install yt-dlp via pip
RUN pip3 install yt-dlp

# Set working directory
WORKDIR /app

# Copy everything into the container
COPY . .

# Install Node.js dependencies
RUN npm install

# Expose the app port
EXPOSE 8800

# Start the server
CMD ["npm", "start"]
