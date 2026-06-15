const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

jest.mock('../services/yookassaService', () => ({
  createPayment: jest.fn().mockResolvedValue({
    id: 'mock_yk_payment_id',
    status: 'pending',
    confirmation: { confirmation_url: 'https://yookassa.ru/checkout/mock' },
  }),
  getPayment: jest.fn().mockResolvedValue({ id: 'mock_yk_payment_id', status: 'succeeded' }),
}));

let mongod;
let app;
let token;
let broadcastId;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test_secret';
  app = require('../server').app;
  await mongoose.connect(process.env.MONGO_URI);

  // Учитель
  const teacherRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'pay_teacher@test.com', password: '123456', username: 'payteacher', role: 'teacher' });
  const teacherToken = teacherRes.body.token;

  await request(app)
    .put('/api/profile/teacher')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ fullName: 'T', education: 'T', experience: 'T', specialization: 'T', hourlyRate: 100, bio: 'T' });

  const brRes = await request(app)
    .post('/api/broadcasts')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ title: 'Платная трансляция', price: 999 });
  broadcastId = brRes.body._id;

  // Студент
  const stuRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'pay_student@test.com', password: '123456', username: 'paystudent', role: 'student' });
  token = stuRes.body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('POST /api/payments/create', () => {
  it('создаёт платёж через (мок) ЮKassa', async () => {
    const res = await request(app)
      .post('/api/payments/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId: broadcastId, itemType: 'broadcast' });
    expect(res.status).toBe(200);
    expect(res.body.confirmationUrl).toContain('yookassa');
  });

  it('без авторизации — 401', async () => {
    const res = await request(app)
      .post('/api/payments/create')
      .send({ itemId: broadcastId, itemType: 'broadcast' });
    expect(res.status).toBe(401);
  });
});
