// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Utils to bring in helpers and data from which database was created
import utils from './setup/utils';

/*
 * SETUP
 */

describe('Litters exist!', () => {
  test('A litter endpoint exists', async () => {
    const res = await request(app).get('/litters');
    expect(res.statusCode).toEqual(200);
  });
});
