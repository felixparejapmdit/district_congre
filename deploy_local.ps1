# deploy_local.ps1
# Deploys the application locally using the standard development configuration

Write-Host "Deploying Locally..." -ForegroundColor Green

# Bring down existing containers
docker-compose -f docker-compose.yml down

# Up with build, using the standard .env file
docker-compose -f docker-compose.yml --env-file .env up -d --build

Write-Host "Local deployment command sent. Check logs with: docker-compose -f docker-compose.yml logs -f" -ForegroundColor Cyan
