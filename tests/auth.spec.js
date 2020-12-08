// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Utils to bring in helpers and data from which database was created
import utils from './setup/utils';

describe('Login endpoint exists', () => {
  test('Get a response from login endpoint', async () => {
    const res = await request(app).post('/auth/login');
    for (const badCode of [404, 500]) {
      expect(res.statusCode).not.toEqual(badCode);
    }
    expect(res.body).toBeDefined();
  });
});
