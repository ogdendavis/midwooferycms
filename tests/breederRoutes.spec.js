// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Tests assume database contains exact data as set up in databaseSetup.js
// So directly import the data used, do compare!
import { breeders, dogs } from './setup/databaseSetup';

describe('GET /breeders endpoint', () => {
  test('Gets all data', async () => {
    const res = await request(app).get('/breeders');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toEqual(breeders.length);
  });
});
