#!/bin/bash

# deploy_prod.sh
# Deploys the application to production using the specific production configuration

echo -e "\033[0;32mDeploying to Production...\033[0m"

# Bring down existing containers to ensure a clean slate
docker-compose -f docker-compose.prod.yml down

# Up with build, using the proxmox env file
docker-compose -f docker-compose.prod.yml --env-file .env.proxmox up -d --build

echo -e "\033[0;36mDeployment command sent. Check logs with: docker-compose -f docker-compose.prod.yml logs -f\033[0m"
