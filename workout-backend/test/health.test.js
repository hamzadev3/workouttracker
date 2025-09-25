// apps/api/test/health.test.js
process.env.TEST_BYPASS_AUTH = '1';

const request = require('supertest');
const { app } = require('../src/server');

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
