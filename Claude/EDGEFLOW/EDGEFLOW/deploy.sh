#!/bin/bash
set -e

echo "🚀 EdgeFlow deploy starting..."

# Переходим в директорию проекта
cd "$(dirname "$0")"

# Проверяем наличие .env
if [ ! -f .env ]; then
  echo "❌ .env файл не найден! Скопируйте .env.example в .env и заполните данные."
  exit 1
fi

# Получаем свежий код
echo "📦 Pulling latest changes..."
git pull origin main

# Пересобираем и перезапускаем
echo "🔨 Building and restarting services..."
docker-compose -f docker-compose.prod.yml pull mongodb srs nginx-proxy certbot
docker-compose -f docker-compose.prod.yml up -d --build backend frontend

# Ждём backend
echo "⏳ Waiting for backend to be ready..."
sleep 5
for i in $(seq 1 10); do
  if curl -sf http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
    break
  fi
  echo "   Attempt $i/10..."
  sleep 3
done

# Убираем старые образы
echo "🧹 Pruning old images..."
docker image prune -f

echo "✅ Deploy complete! EdgeFlow is running."
echo "   Frontend: http://localhost"
echo "   API:      http://localhost/api"
echo "   RTMP:     rtmp://$(hostname):1935/live"
