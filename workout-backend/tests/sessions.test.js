// apps/api/test/sessions.test.js
process.env.TEST_BYPASS_AUTH = '1';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { app } = require('../src/server');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: 'test' });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

test('public feed lists public sessions', async () => {
  // Create one session as "owner"
  const body = { name: 'Push Day', userId: 'u1', userName: 'alice', isPublic: true };
  const create = await request(app)
    .post('/api/sessions')
    .set('x-test-user-id', 'u1')
    .send(body);
  expect(create.status).toBe(201);

  // Guests can list it (no auth)
  const list = await request(app).get('/api/sessions');
  expect(list.status).toBe(200);
  expect(list.body.length).toBeGreaterThanOrEqual(1);
  expect(list.body[0].name).toBe('Push Day');
});
