#!/bin/bash

# deploy_local.sh
# Deploys the application locally using the standard development configuration

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

echo -e "\033[0;32mDeploying Locally using '$DOCKER_COMPOSE'...\033[0m"

# 🟢 FIX: Bypass broken credential helper configuration in Windows/Bash
export DOCKER_CONFIG="./.docker_tmp"
mkdir -p "$DOCKER_CONFIG"
echo '{"credsStore": ""}' > "$DOCKER_CONFIG/config.json"

# Bring down existing containers to ensure a clean slate
$DOCKER_COMPOSE -f docker-compose.yml down --remove-orphans

# Up with build, using the standard .env file
$DOCKER_COMPOSE -f docker-compose.yml --env-file .env up -d --build

echo -e "\033[0;36mLocal deployment complete! App accessible at http://localhost:8080\033[0m"
echo -e "\033[0;36mCheck logs with: $DOCKER_COMPOSE -f docker-compose.yml logs -f\033[0m"
