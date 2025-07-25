# Use an official Node.js runtime as a parent image
# Using a specific version like '20-bullseye-slim' is reliable
FROM node:20-bullseye-slim

# Set the working directory in the container
WORKDIR /app

# Prevent apt-get from asking for user input
ENV DEBIAN_FRONTEND=noninteractive

# Install Python and pip, then clean up
# 1. Update package lists
# 2. Install python3, python3-pip, and a helper to link 'python' to 'python3'
# 3. Clean up apt cache to reduce image size
RUN apt-get update && \
    apt-get install -y python3 python3-pip python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

# Install git
RUN apt-get update && \
    apt-get install -y git && \
    rm -rf /var/lib/apt/lists/*

    # install java 17
RUN apt-get update && \
    apt-get install -y openjdk-17-jre && \
    rm -rf /var/lib/apt/lists/*

COPY src src
COPY public public
COPY package.json package.json
COPY server server
COPY requirements.txt requirements.txt
COPY setup.py setup.py

RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir .
RUN npm install 
RUN npm run build

# expose the port the app runs on
EXPOSE 3000


# Define the command to run the app
CMD ["gunicorn", "--bind", "0.0.0.0:3000", "server.wsgi:app"]