## EdgeFloww MVP — Crypto Course Marketplace

An anonymous marketplace for buying and selling online courses with cryptocurrency (USDT) payments and DRM-protected video streaming.

### Features

- **Auth**: Email + password, two roles (Author/Student), auto-generated anonymous usernames
- **Course Management**: Create courses with lessons, upload video (mp4) and cover images
- **Crypto Payments**: Buy courses with USDT (emulated), 5% platform commission
- **DRM Video**: One-time JWT tokens, 15-minute lifetime, served outside public dir
- **Admin Panel**: Confirm pending payments, manage platform balance
- **Reviews**: Rate and review purchased courses
- **Search**: Filter by category, search by title/description

### Quick Start

```bash
# 1. Install backend dependencies
cd backend
npm install
cp .env.example .env

# 2. Install frontend dependencies
cd ../frontend
npm install

# 3. Start backend (terminal 1)
cd ../backend
npm run dev
# → API on http://localhost:3001

# 4. Start frontend (terminal 2)
cd ../frontend
npm run dev
# → App on http://localhost:5173
```

### Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@demo.com | admin123 | Admin (can confirm payments) |
| author@demo.com | author123 | Author (can create courses) |
| student@demo.com | student123 | Student (can buy courses) |

### Project Structure

```
edgefloww-mvp/
├── backend/
│   ├── server.js          # Express entry point
│   ├── routes/            # Auth, courses, payments, videos
│   ├── models/            # SQLite schema + migration
│   ├── middleware/        # JWT auth + DRM token check
│   └── uploads/           # Video + cover storage (outside public)
├── frontend/
│   ├── src/
│   │   ├── pages/         # Login, Register, CourseList, CourseDetail, etc.
│   │   ├── components/    # Navbar
│   │   ├── api.js         # API client with auth
│   │   └── App.jsx        # Router + user state
│   └── index.html
└── README.md
```

### How DRM Works

1. User clicks "Watch" → frontend requests `/api/video/token/:lessonId`
2. Server checks if user has access (purchased or is author)
3. Server generates one-time JWT token (15 min lifetime) stored in DB
4. Frontend gets URL: `/api/video/stream/:lessonId?token=...`
5. Server validates token → marks as used → streams video with `Content-Disposition: inline`
6. Video file is stored in `uploads/videos/` (outside `public/`), only accessible via this endpoint

### Payment Flow

1. Student clicks "Buy" → system creates `Purchase` with status `pending`
2. Student sees wallet address + amount → clicks "I Paid"
3. System emulates confirmation  OR Admin confirms in panel `/admin`
4. On confirmation: 95% goes to author, 5% stays on platform
5. Student gets access to all video lessons
