#!/bin/bash

# deploy_prod.sh
# Deploys the application to production using the specific production configuration

# Detect the docker compose command (v2 plugin vs v1 standalone)
if docker compose version >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "\033[0;31mError: neither 'docker compose' nor 'docker-compose' found.\033[0m"
    echo "Please install Docker and the Compose plugin."
    exit 1
fi

echo -e "\033[0;32mDeploying to Production using '$DOCKER_COMPOSE'...\033[0m"

# 🟢 FIX: Avoid DNS timeout errors on Proxmox/LXC
# echo -e "\033[0;33mConfiguring DNS (8.8.8.8) to prevent image pull timeouts...\033[0m"
# echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf > /dev/null

# echo -e "\033[0;33mRestarting Docker service...\033[0m"
# sudo systemctl restart docker
# sleep 2 # Give docker a moment to breath

# Bring down existing containers to ensure a clean slate
$DOCKER_COMPOSE -f docker-compose.prod.yml down

# Up with build, using the proxmox env file
$DOCKER_COMPOSE -f docker-compose.prod.yml --env-file .env.proxmox up -d --build

echo -e "\033[0;36mDeployment command sent. Check logs with: $DOCKER_COMPOSE -f docker-compose.prod.yml logs -f\033[0m"
