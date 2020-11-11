// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Utils to bring in helpers and data from which database was created
import utils from './setup/utils';

/*
 * GET
 */

describe('GET /litters endpoints', () => {
  test('GET /breeders', async () => {
    const res = await request(app).get('/litters');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(utils.allLitters());
  });

  test('GET /litters/:litterId with valid id', async () => {
    const testLitter = utils.randomLitter();
    const res = await request(app).get(`/litters/${testLitter.id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testLitter);
  });

  test('GET /litters/:litterId with invalid id', async () => {
    const res = await request(app).get('/litters/notavalididatall');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('No litter with ID'));
  });

  test('GET /litters/:litterId/pups for litter with pups', async () => {
    const testLitter = utils.randomLitterWithPups();
    const testPups = utils
      .allDogs()
      .filter((d) => d.litterId === testLitter.id);
    const res = await request(app).get(`/litters/${testLitter.id}/pups`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testPups);
  });
});
