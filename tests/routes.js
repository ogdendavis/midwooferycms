// Tests for API endpoints

// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

describe('Dog Endpoints', () => {
  it('GET /dogs', async (done) => {
    const res = await request(app).get('/dogs');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeDefined();
    done();
  });
});
