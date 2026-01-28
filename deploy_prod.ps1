# deploy_prod.ps1
# Deploys the application to production using the specific production configuration
Write-Host "Deploying to Production..." -ForegroundColor Green

# Bring down existing containers to ensure a clean slate (optional, but good for removing orphans)
docker-compose -f docker-compose.prod.yml down

# Up with build, using the proxmox env file
docker-compose -f docker-compose.prod.yml --env-file .env.proxmox up -d --build

Write-Host "Deployment command sent. Check logs with: docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor Cyan
