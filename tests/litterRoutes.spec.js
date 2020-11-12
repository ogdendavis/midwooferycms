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

  test('GET /litters/:litterId with bad id', async () => {
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

  test('GET /litters/:litterId/pups for litter without pups', async () => {
    // We know that litter with ID l2 has no pups
    const testLitter = utils.allLitters().filter((l) => l.id === 'l2')[0];
    // Expecting no pups
    const testPups = utils
      .allDogs()
      .filter((d) => d.litterId === testLitter.id);
    expect(testPups).toEqual([]);
    const res = await request(app).get(`/litters/${testLitter.id}/pups`);
    expect(res.statusCode).toEqual(204);
    expect(res.body).toEqual({});
  });

  test('GET /litters/:litterId/pups with bad litter id', async () => {
    const res = await request(app).get('/litters/notalitter/pups');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({});
  });

  test('GET /litters/:litterId/breeder with valid id', async () => {
    const testLitter = utils.randomLitter();
    const testBreeder = utils
      .allBreeders()
      .filter((b) => b.id === testLitter.breederId)[0];
    const res = await request(app).get(`/litters/${testLitter.id}/breeder`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testBreeder);
  });

  test('GET /litters/:litterId/breeder with bad id', async () => {
    const res = await request(app).get('/litters/qwerty/breeder');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('No litter with ID'));
  });
});
