const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let app;
let teacherToken;
let studentToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test_secret';
  app = require('../server').app;
  await mongoose.connect(process.env.MONGO_URI);

  // Регистрируем учителя и заполняем анкету
  const teacherRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'teacher@test.com', password: '123456', username: 'teacher1', role: 'teacher' });
  teacherToken = teacherRes.body.token;

  await request(app)
    .put('/api/profile/teacher')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({
      fullName: 'Иван Иванов',
      education: 'МГУ',
      experience: '5 лет',
      specialization: 'Программирование',
      hourlyRate: 1500,
      bio: 'Опытный преподаватель',
    });

  const studentRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'student@test.com', password: '123456', username: 'student1', role: 'student' });
  studentToken = studentRes.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('POST /api/broadcasts', () => {
  it('учитель с анкетой создаёт трансляцию', async () => {
    const res = await request(app)
      .post('/api/broadcasts')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Урок JavaScript', description: 'Основы', price: 500 });
    expect(res.status).toBe(201);
    expect(res.body.streamKey).toBeDefined();
    expect(res.body.title).toBe('Урок JavaScript');
  });

  it('студент не может создать трансляцию', async () => {
    const res = await request(app)
      .post('/api/broadcasts')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Test', price: 0 });
    expect(res.status).toBe(403);
  });

  it('без авторизации — 401', async () => {
    const res = await request(app)
      .post('/api/broadcasts')
      .send({ title: 'Test', price: 0 });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/broadcasts', () => {
  it('возвращает список трансляций', async () => {
    const res = await request(app).get('/api/broadcasts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /active — только живые', async () => {
    const res = await request(app).get('/api/broadcasts/active');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
