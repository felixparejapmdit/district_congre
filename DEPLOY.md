# Production Deployment Instructions

## 1. Prerequisites
- Ensure the Proxmox server (`172.18.121.72`) has Docker and Docker Compose installed.
- Ensure the external database at `172.18.121.20` is accessible from the Proxmox server.
- Ensure your SSL certificates (`cert.pem` and `key.pem`) are present in `nginx/certs/`.

## 2. Configuration Changes Applied
- **Backend**: Updated `pkg.json` to include a start script and `Dockerfile` to support Puppeteer (scraping).
- **Frontend**: Updated `.env.proxmox` to point to `https://172.18.121.72`.
- **Nginx**: Created `nginx/default.prod.conf` to handle IP access and standard ports (80/443).
- **Compose**: Created `docker-compose.prod.yml` optimized for production (no code mounting).

## 3. Deploy
Run the following command on the server to deploy:

```powershell
docker-compose -f docker-compose.prod.yml --env-file .env.proxmox up -d --build
```

## 4. Verify
Access the application at:
- **URL**: `https://172.18.121.72`
- **Output**: Check logs with `docker-compose -f docker-compose.prod.yml logs -f`

## 5. Troubleshooting
- If you see `502 Bad Gateway`, check backend logs: `docker logs inc-backend`.
- If database connection fails, ensure the container can reach `172.18.121.20`.
