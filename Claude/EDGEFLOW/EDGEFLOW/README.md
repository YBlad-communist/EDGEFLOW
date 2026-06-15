# EdgeFlow — биржа живых знаний

Маркетплейс онлайн-трансляций с живым видео (HLS/RTMP), ролями студента и учителя, оплатой через ЮKassa и чатом в реальном времени.

## Стек

| Слой | Технологии |
|------|-----------|
| Backend | Node.js, Express, MongoDB, Socket.IO |
| Frontend | React 18, Vite, TailwindCSS |
| Медиасервер | SRS (Simple Realtime Server) |
| Оплата | ЮKassa |
| Инфра | Docker, Docker Compose, Nginx |

---

## Быстрый старт

### 1. Клонировать репозиторий

```bash
git clone https://github.com/YBlad-communist/EDGEFLOW.git
cd EDGEFLOW
```

### 2. Настроить переменные окружения

```bash
cp backend/.env.example .env
```

Заполните в `.env`:

```
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=test_your_key
JWT_SECRET=придумайте_длинный_секрет
FRONTEND_URL=http://localhost
YOOKASSA_RETURN_URL=http://localhost/payment/success
```

Тестовые ключи ЮKassa получить в [личном кабинете](https://yookassa.ru/my/shop-settings/integration).

### 3. Запустить медиасервер (SRS)

```bash
docker-compose -f docker-compose.srs.yml up -d
```

### 4. Запустить весь проект

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

Откройте **http://localhost** в браузере.

---

## Локальная разработка (без Docker)

### Backend

```bash
cd backend
npm install
cp ../.env.example .env   # заполните MONGO_URI=mongodb://localhost:27017/edgeflow
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Как работает трансляция

1. Учитель регистрируется с ролью **Учитель** и заполняет анкету.
2. Создаёт трансляцию — получает `streamKey`.
3. Открывает OBS и настраивает:
   - **Сервер:** `rtmp://localhost:1935/live`
   - **Ключ:** `<streamKey>` из карточки трансляции
4. Нажимает «Начать» на странице трансляции — статус становится LIVE.
5. Студенты покупают доступ (или смотрят бесплатно) и видят HLS-поток с чатом.

---

## Тесты

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

---

## Деплой на VPS

```bash
chmod +x deploy.sh
./deploy.sh
```

Для SSL — раскомментируйте HTTPS-блок в `nginx.conf` и получите сертификат:

```bash
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot -w /var/www/certbot -d yourdomain.com
```

---

## Структура проекта

```
EDGEFLOW/
├── backend/
│   ├── models/          # Mongoose схемы
│   ├── routes/          # Express роуты
│   ├── middleware/       # auth, teacherRequired, errorHandler
│   ├── services/        # yookassaService, srsService
│   └── tests/           # Jest + supertest
├── frontend/
│   └── src/
│       ├── context/     # AuthContext
│       ├── components/  # Navbar, HlsPlayer, LiveChat, Tour...
│       ├── pages/       # Login, Register, Profile, BroadcastDetail...
│       └── tests/       # Vitest + RTL
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.prod.yml
├── docker-compose.srs.yml
├── nginx.conf
├── srs.conf
└── deploy.sh
```

---

## Комиссия платформы

С каждой оплаченной трансляции удерживается **15%**. Остальное зачисляется на баланс учителя. Вывод — через раздел «Настройки».

---

## Лицензия

MIT
