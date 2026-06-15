# EdgeFlow — Маркетплейс онлайн-курсов с живыми трансляциями

Платформа для создания, продажи и покупки онлайн-курсов с поддержкой живых трансляций (HLS + RTMP через SRS), ролями (студент/учитель), внутренним балансом и оплатой через ЮKassa.

## Стек

- **Backend**: Node.js + Express + MongoDB + Socket.io
- **Frontend**: React + Vite + TailwindCSS
- **Media**: SRS (Simple Realtime Server) для HLS/RTMP
- **Payments**: ЮKassa
- **Infra**: Docker + Docker Compose

## Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone <repo-url> edgeflow
cd edgeflow
```

### 2. Настроить окружение

```bash
cp backend/.env.example backend/.env
# Отредактируйте backend/.env, укажите YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY
```

### 3. Запустить SRS (медиасервер)

```bash
docker compose -f docker-compose.srs.yml up -d
```

### 4. Запустить проект

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 5. Открыть браузер

Перейдите на `http://localhost`

## Разработка без Docker

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Фронтенд будет на `http://localhost:5173`, бэкенд на `http://localhost:3001`.

## Переменные окружения (backend/.env)

| Переменная | Описание |
|---|---|
| PORT | Порт сервера (по умолч. 3001) |
| MONGODB_URI | URI MongoDB |
| JWT_SECRET | Секрет для JWT |
| YOOKASSA_SHOP_ID | ID магазина ЮKassa |
| YOOKASSA_SECRET_KEY | Секретный ключ ЮKassa |
| SRS_API_URL | URL API SRS (по умолч. http://localhost:1985) |
| SRS_ORIGIN | URL HLS (по умолч. http://localhost:8080) |
| SRS_RTMP_HOST | RTMP хост (по умолч. rtmp://localhost/live) |

## Архитектура

- `backend/` — Express сервер с моделями, роутами, middleware
- `frontend/` — React SPA с Vite и TailwindCSS
- `srs.conf` — конфигурация SRS медиасервера
- `docker-compose.prod.yml` — продакшн стек (backend + frontend + mongodb)
- `docker-compose.srs.yml` — SRS для стриминга
