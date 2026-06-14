# EdgeFloww — Crypto Course Marketplace

Production-ready MVP платформы для покупки и продажи курсов за USDT (BSC Testnet) с DRM-защитой видео.

## 🚀 Features

- **Auth**: Email + password, bcrypt, JWT (7d), роли Student / Author / Admin
- **Courses**: CRUD, категории, поиск, загрузка обложек, вложенные уроки с видео
- **Payments**: 
  - 🦊 **MetaMask** — реальная оплата USDT через BSC Testnet (контракт `0x337610d27c682E347C9cD60BD4b3b107C9d34dDd`)
  - 🧪 **Эмуляция** — для разработки и тестирования
  - Верификация транзакции через публичный RPC
  - Комиссия платформы 5%
- **DRM Video**: 
  - HMAC-SHA256 подписанные токены
  - 15 минут жизни, одноразовые
  - Проверка Referer (только с домена платформы)
  - Защита контекстного меню на плеере
- **Withdrawals**: Вывод средств авторами (через админ-панель)
- **Admin Panel**: Подтверждение платежей, управление выводами
- **Docker**: Многоступенчатая сборка, Nginx, SSL (Let's Encrypt)

## 📋 Variables окружения

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Backend port |
| `NODE_ENV` | `development` | Environment |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `JWT_SECRET` | — | JWT signing key |
| `JWT_EXPIRES_IN` | `7d` | JWT lifetime |
| `MONGODB_URI` | `mongodb://mongo:27017/edgefloww` | MongoDB connection |
| `DRM_SECRET` | — | DRM token signing key |
| `DRM_TOKEN_TTL_MINUTES` | `15` | DRM token lifetime |
| `BSC_RPC_URL` | — | BSC Testnet RPC URL |
| `USDT_CONTRACT_ADDRESS` | `0x337610d27c682E347C9cD60BD4b3b107C9d34dDd` | USDT contract on BSC Testnet |
| `PLATFORM_WALLET_ADDRESS` | — | Platform wallet for receiving USDT |
| `PLATFORM_WALLET_PRIVATE_KEY` | — | Private key for sending withdrawals |
| `PLATFORM_COMMISSION_PERCENT` | `5` | Platform commission |
| `UPLOAD_DIR` | `./uploads` | Upload directory |
| `MAX_FILE_SIZE_MB` | `500` | Max upload size |

## 🛠 Локальный запуск (dev)

### Requirements
- Node.js 20+
- MongoDB 7+ (локально или Docker: `docker run -d -p 27017:27017 mongo:7`)

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run seed    # заполнить тестовыми данными
npm run dev     # http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
```

## 🐳 Production деплой (Docker)

### Requirements
- Linux VPS (Ubuntu 22.04+)
- Docker + Docker Compose
- Домен, привязанный к IP сервера

### Быстрый старт
```bash
git clone https://github.com/YOUR_USER/EDGEFLOW.git
cd EDGEFLOW/edgefloww-mvp

# Настройка окружения
cp .env.prod.example .env.prod
nano .env.prod   # заполнить секреты, домен, кошелёк

# Деплой
chmod +x deploy.sh
./deploy.sh
```

### Ручной деплой по шагам
```bash
# 1. Скопировать .env.prod и настроить
cp .env.prod.example .env.prod

# 2. Запустить MongoDB + Backend + Frontend + Nginx + Certbot
docker compose -f docker-compose.prod.yml up -d --build

# 3. Первичная настройка SSL (если не через deploy.sh)
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email admin@yourdomain.com --agree-tos \
  -d yourdomain.com

# 4. Перезагрузить Nginx
docker compose -f docker-compose.prod.yml exec frontend nginx -s reload
```

## 👥 Demo Accounts (после seed)

| Email | Password | Role |
|---|---|---|
| admin@demo.com | admin123 | Admin |
| author@demo.com | author123 | Author |
| student@demo.com | student123 | Student |

## 🔐 DRM Architecture

```
1. Frontend запрашивает /api/video/token/:lessonId
2. Backend проверяет purchase/isOwner
3. Генерируется HMAC-SHA256 токен (15 мин), сохраняется в MongoDB
4. Frontend получает подписанную ссылку /api/video/stream/:lessonId?token=...
5. DRM middleware:
   - Проверяет токен в БД (не использован, не истёк)
   - Проверяет HMAC-SHA256 подпись
   - Проверяет Referer (только с домена платформы)
   - Помечает токен как использованный
6. Видео стримится с range support
```

## 💰 Payment Flow

```
1. Student нажимает "Pay with MetaMask" или "Buy (Emulated)"
2. MetaMask: создаётся транзакция USDT через ethers.js
3. Backend верифицирует txHash через BSC RPC:
   - Проверяет to = USDT contract
   - Проверяет событие Transfer на адрес платформы
   - Проверяет сумму (≥ 99% от цены)
4. 95% начисляется автору, 5% платформе
5. Student получает доступ к видео
```

## 📁 Project Structure

```
edgefloww-mvp/
├── backend/
│   ├── server.js              # Express entry point
│   ├── models/                # Mongoose models (User, Course, Purchase, etc.)
│   ├── routes/                # Auth, Courses, Payments, Videos, Withdraw
│   ├── middleware/             # JWT auth, DRM (HMAC-SHA256)
│   └── uploads/               # Videos + covers (outside public)
├── frontend/
│   ├── src/
│   │   ├── pages/             # 9 pages (Login → AdminPanel)
│   │   ├── components/        # Navbar
│   │   ├── context/           # Web3Provider (MetaMask)
│   │   ├── api.js             # API client
│   │   └── App.jsx            # Router + Web3Provider
│   └── index.html             # Dark theme CSS
├── Dockerfile.backend
├── Dockerfile.frontend
├── docker-compose.prod.yml
├── nginx.conf
├── deploy.sh
└── .env.prod.example
```

## 🧪 API Examples

```bash
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"1234","role":"student"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@demo.com","password":"student123"}'

# Create course (author only)
curl -X POST http://localhost:3001/api/courses \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Course","priceUSDT":10,"category":"web3"}'

# Buy course (emulated)
curl -X POST http://localhost:3001/api/payments/buy/COURSE_ID \
  -H "Authorization: Bearer TOKEN"

# Get DRM token
curl http://localhost:3001/api/video/token/LESSON_ID \
  -H "Authorization: Bearer TOKEN"
```

## 🧪 Testing

```bash
cd backend
npm test
```

## 📄 License

MIT
