#!/bin/bash

# Set a colorful PS1 prompt directly in your Dockerfile or startup script
echo 'export PS1="\[\e[92m\]\u@\h:\[\e[36m\]\w\[\e[00m\]\$ "' >> ~/.bashrc

# Apply changes without needing to re-login
source ~/.bashrc

# Start Redis server
echo "Starting Redis server..."
redis-server &
echo "Redis server started successfully."

# Start MongoDB server
echo "Starting MongoDB server..."
mongod --fork --logpath /var/log/mongodb.log
echo "MongoDB server started successfully."

# Check if the command argument is provided
if [ -z "$1" ]; then
    # If no command is provided, use `tail -f /dev/null` to keep the container running
    tail -f /dev/null
else
    # If a command is provided (e.g., when using `docker exec`, 'exec-cmd'), execute it
    exec "$@"
fi
