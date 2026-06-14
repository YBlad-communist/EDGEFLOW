#!/usr/bin/env bash
set -euo pipefail

echo "=== EdgeFloww Deploy Script ==="

# Configuration
DOMAIN="${DOMAIN:-example.com}"
EMAIL="${EMAIL:-admin@example.com}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || command -v docker >/dev/null 2>&1 || { echo "Docker Compose is required"; exit 1; }

# Load environment
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found. Create from .env.example"
  exit 1
fi

# Pull latest code
echo "Pulling latest changes..."
git pull origin main

# Build and deploy
echo "Building and deploying..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans
docker compose -f "$COMPOSE_FILE" up -d --build

# Wait for health checks
echo "Waiting for services to be healthy..."
sleep 10

# Initial SSL setup (first run only)
if [ ! -d "certbot_conf/live/$DOMAIN" ]; then
  echo "Setting up SSL certificate for $DOMAIN..."
  docker compose -f "$COMPOSE_FILE" run --rm certbot certonly \
    --webroot --webroot-path=/var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d "$DOMAIN"

  # Reload nginx to pick up certs
  docker compose -f "$COMPOSE_FILE" exec frontend nginx -s reload || true
fi

echo "=== Deploy complete ==="
echo "Site: https://$DOMAIN"
echo "Health: https://$DOMAIN/api/health"
