# Use a base image with Node.js and Python
FROM node:18-bullseye

# Install Python, pip, and ffmpeg with necessary libraries
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    libx264-dev \
    libvpx-dev \
    libmp3lame-dev \
    libopus-dev \
    libx265-dev \
    && rm -rf /var/lib/apt/lists/*

# Adding the deb-multimedia repository for libfdk-aac-dev support
RUN echo "deb http://www.deb-multimedia.org bullseye main" > /etc/apt/sources.list.d/deb-multimedia.list && \
    apt-get update && \
    apt-get install -y libfdk-aac-dev && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN python3 -m pip install --upgrade pip

# Set working directory
WORKDIR /app

# Create the clips directory inside the container
RUN mkdir -p /app/clips

# Copy only the necessary files for npm install
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Now copy the rest of the app
COPY . .

# Expose your app's port
EXPOSE 8800

# Start your app
CMD ["npm", "start"]
