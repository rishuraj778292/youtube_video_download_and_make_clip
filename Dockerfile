# Use a base image that has both Node.js and Python
FROM node:18-bullseye

# Install Python, pip, and ffmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg

# Confirm pip is available
RUN python3 -m pip install --upgrade pip

# Install yt-dlp
RUN pip3 install yt-dlp

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
