const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let app;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test_secret';
  const serverModule = require('../server');
  app = serverModule.app;
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('POST /api/auth/register', () => {
  it('регистрирует нового пользователя', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: '123456', username: 'tester', role: 'student' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('test@test.com');
    expect(res.body.user.password).toBeUndefined();
  });

  it('не регистрирует с дублирующимся email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: '123456', username: 'u1', role: 'student' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: '123456', username: 'u2', role: 'student' });
    expect(res.status).toBe(400);
  });

  it('валидирует роль', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad@test.com', password: '123456', username: 'u', role: 'admin' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@test.com', password: 'password1', username: 'loginuser', role: 'student' });
  });

  it('выдаёт токен при правильных данных', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'password1' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('отказывает при неверном пароле', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });
});
