# Description: Makefile for the Redis basic project.
# This Makefile is used to manage Docker containers and images for development and testing.
# This Makefile is used to
# build status start run exec stop clean deep-clean the Docker container.
# Created by: CKCarr
# Created on: 02/02/2024

# define a function to log make file executions for targets start and stop
define log_and_run
	@echo "`date +'%Y-%m-%d %H:%M:%S'` - Running command $(1)" | tee -a make.log
	@$(1) >> make.log 2>&1
endef

# Color definitions
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
NC=\033[0m # No Color

# Default action if no target is specified

# make - will execute the build target
.DEFAULT_GOAL := build

# Docker image variables for container names and directories
# The HOST_DIRECTORY is the current directory
# the CONTAINER_DIRECTORY is the directory inside the Docker container
DOCKER_IMAGE_NAME = atlas-files_manager_image
DOCKER_CONTAINER_NAME = atlas-files_manager_container
HOST_DIRECTORY=./
CONTAINER_DIRECTORY=/atlas-files_manager
VOLUME_NAME = atlas-files_manager_volume

.PHONY: build status start create-volume inspect-volume run exec stop clean deep-clean

# Build the Docker image in the current directory
build:
	@echo "${GREEN}Building the Docker image...${NC}"
	docker build -t $(DOCKER_IMAGE_NAME) .

# this will check the container status
# informs the user about the container's state
# and prevents the start target from running
# if the container is not in a stopped state
status:
	@echo "${YELLOW}Checking the status of $(DOCKER_CONTAINER_NAME)...${NC}"

	@STATUS=$$(docker container inspect -f '{{.State.Status}}' $(DOCKER_CONTAINER_NAME) 2>/dev/null); \
    if [ "$$STATUS" = "running" ]; then \
        echo "${GREEN}$(DOCKER_CONTAINER_NAME) is already running.${NC}"; \
        exit 1; \
    elif [ "$$STATUS" = "exited" ]; then \
        echo "${YELLOW}$(DOCKER_CONTAINER_NAME) is stopped. Ready to start...${NC}"; \
    elif [ "$$STATUS" = "paused" ]; then \
        echo "${YELLOW}$(DOCKER_CONTAINER_NAME) is paused. You might want to unpause or stop it before proceeding.${NC}"; \
        exit 1; \
    else \
        echo "${RED}$(DOCKER_CONTAINER_NAME) does not exist or is in an unknown state.${NC}"; \
        exit 1; \
    fi

# Start an existing, stopped container with logs
start: status
	@echo "${GREEN}Starting the existing Docker container...${NC}"

	$(call log_and_run, docker start $(DOCKER_CONTAINER_NAME))

	@echo "`date +'%Y-%m-%d %H:%M:%S'` - Your container was restarted successfully!" | tee -a make.log

# Create the container volume for persistent storage
create-volume:
	@echo "${GREEN}Creating Docker volume for ${VOLUME_NAME} container data...${NC}"

	docker volume create $(VOLUME_NAME)

	@echo "${YELLOW}Docker Volume created - Storage persists${NC}"

# target to inspect volume for debugging
# understand where Docker is storing the volume data on the host system
inspect-volume:
	@echo "${GREEN}Inspecting volume ${VOLUME_NAME}...${NC}"
	docker volume inspect $(VOLUME_NAME)

# Run the Docker container in the background "-d" -detached
# with the current directory mounted to the container directory
# set volume to persist sql data by mounting volume to appropriate
# directory inside the container
run: build
	@echo "${GREEN}Running the Docker container in the background Mode or interactive Mode...${NC}"
	@echo "${YELLOW}If interactive Type 'exit' to stop the container and return to the host shell.${NC}"
	docker run -d --name $(DOCKER_CONTAINER_NAME) \
	-v "$(HOST_DIRECTORY)":$(CONTAINER_DIRECTORY) \
	-v $(VOLUME_NAME):/data/db \
	-p 3000:3000 \
	-p 4000:4000 \
	-p 6379:6379 \
	-p 5000:5000 \
	$(DOCKER_IMAGE_NAME)
	@echo "`date +'%Y-%m-%d %H:%M:%S'` - Hurray!!! Your container is up and Running!" | tee -a make.log

# Execute a bash shell in the Docker container for debugging purposes
# allows for running commands inside the container
# Example: make exec-cmd CMD="ls -l" - will execute "ls -l" inside the container
# setting bash as default for running make exec-cmd
CMD ?= "bash"

exec:
	@echo "${YELLOW}Executing a bash CMD or entering shell inside the Docker container...$(NC)"

	docker exec -it $(DOCKER_CONTAINER_NAME) /bin/bash -c $(CMD)

# Stop running Docker container and remove it
# This frees up resources - with logs
stop:
	@echo "${RED}Stopping the Docker container...${NC}"

	$(call log_and_run, docker stop $(DOCKER_CONTAINER_NAME))

	@echo "`date +'%Y-%m-%d %H:%M:%S'` - You have successfully stopped your container." | tee -a make.log

# Clean up Docker container and image
# This is useful for removing all traces of the Docker container
# and image from the system - with logs
clean:
	@echo "`date +'%Y-%m-%d %H:%M:%S'` - Starting clean target" | tee -a make.log
	@echo "${RED}Cleaning up the Docker container and image...${NC}"

	@docker stop $(DOCKER_CONTAINER_NAME) || true
	@docker rm $(DOCKER_CONTAINER_NAME) || true
	@docker rmi $(DOCKER_IMAGE_NAME) || true

	@echo "`date +'%Y-%m-%d %H:%M:%S'` - Finished clean target" | tee -a make.log

# Clean up Docker container and image
# This is useful for removing all traces of the Docker container
# and image from the system as well as any volumes stored - with logs
# !! CAUTION !! THIS WILL REMOVE AND PERSISTANT STORAGE !!
deep-clean:
	@echo "`date +'%Y-%m-%d %H:%M:%S'` - Starting deep-clean target" | tee -a make.log
	@echo "${RED}Cleaning up the Docker container, image, and volume...${NC}"

	docker stop $(DOCKER_CONTAINER_NAME) || true
	docker rm $(DOCKER_CONTAINER_NAME) || true
	docker rmi $(DOCKER_IMAGE_NAME) || true
	docker volume rm $(VOLUME_NAME) || true

	@echo "`date +'%Y-%m-%d %H:%M:%S'` - Finished deep-clean target" | tee -a make.log
