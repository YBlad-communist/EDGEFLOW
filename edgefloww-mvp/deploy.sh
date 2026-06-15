#!/bin/bash
set -e

echo "Deploying EdgeFlow..."

cd /opt/edgeflow

git pull origin main

cp backend/.env.example backend/.env || true

docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

docker image prune -f

echo "Deploy complete!"
