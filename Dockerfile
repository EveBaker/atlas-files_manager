FROM ubuntu:18.04

# Set noninteractive to avoid tzdata hanging
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=America/Los_Angeles

# Install essential tools and dependencies
RUN apt-get update && apt-get install -y \
    lsof \
    curl \
    wget \
    git \
    vim \
    emacs \
    locales \
    build-essential \
    gcc &&\
    locale-gen en_US.UTF-8

# Set environment variables
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# Install Node.js
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash - && \
    apt-get install -y nodejs

# Install MongoDB
RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.2.asc | apt-key add - && \
    echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/4.2 multiverse" > /etc/apt/sources.list.d/mongodb-org-4.2.list && \
    apt-get update && \
    apt-get install -y mongodb-org && \
    mkdir -p /data/db

# Install redis server and the redis client
RUN apt-get install -y redis-server && \
    sed -i "s/bind .*/bind 127.0.0.1/g" /etc/redis/redis.conf

# Clean up APT when done
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /atlas-files_manager

# Copy the rest of your application code
COPY . /atlas-files_manager

# Install Node.js project dependencies
RUN npm install

# Expose ports (if needed)
EXPOSE 3000 4000 6379 5000

# Make the start script executable
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Create a non-root user and switch to it
RUN useradd -m correction_tester
# USER correction_tester

ENTRYPOINT ["/start.sh"]
