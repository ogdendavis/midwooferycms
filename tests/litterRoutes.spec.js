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

/*
 * POST
 */

describe('POST /litters endpoint', () => {
  test('Creates a litter from full data', async () => {
    const data = {
      id: 'tl',
      breederId: utils.randomBreeder().id,
      count: 10,
      dam: { id: utils.randomDog({ sex: 'f' }).id },
      sire: { name: 'Al' },
      pups: [],
    };
    const res = await request(app).post('/litters').send(data);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(utils.dataize(data));
  });

  test('Generates a unique ID for newly created litter', async () => {
    const data = {
      breederId: utils.randomBreeder().id,
      count: 12,
      dam: { id: utils.randomDog({ sex: 'f' }).id },
      sire: { name: 'Thomas' },
      pups: [],
    };
    const res = await request(app).post('/litters').send(data);
    expect(res.statusCode).toEqual(201);
    const expectedLitter = { ...utils.dataize(data), id: expect.anything() };
    expect(res.body).toEqual(expectedLitter);
    // Confirm that ID is valid by grabbing the litter
    const getRes = await request(app).get(`/litters/${res.body.id}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body).toEqual(expectedLitter);
  });

  test('Creates a litter from minimum required data', async () => {
    const data = {
      breederId: utils.randomBreeder().id,
      dam: { id: utils.randomDog({ sex: 'f' }).id },
    };
    const res = await request(app).post('/litters').send(data);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(expect.objectContaining(data));
  });

  test('Rejects a litter without required data', async () => {
    const data = {
      sire: { name: 'Mr. Nopesies' },
      count: 33,
    };
    const res = await request(app).post('/litters').send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('breederId dam'));
  });

  test('Rejects a litter with invalid breederId', async () => {
    const data = {
      id: 'tlbadbreeder',
      breederId: 'utils.randomBreeder().id',
      count: 10,
      dam: { name: 'Jane' },
    };
    const res = await request(app).post('/litters').send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(
      expect.stringContaining(`Invalid breederId: ${data.breederId}`)
    );
  });

  test('Rejects a litter with invalid dam information', async () => {
    // Get a random valid breeder id to use in all requests
    const breederId = utils.randomBreeder().id;
    // Case for bad ID provided
    const badId = {
      breederId,
      dam: { id: 'notanidatall' },
    };
    const badIdRes = await request(app).post('/litters').send(badId);
    expect(badIdRes.statusCode).toEqual(400);
    expect(badIdRes.body).toEqual({});
    expect(badIdRes.text).toEqual(
      expect.stringContaining(`No dog found with ID ${badId.dam.id}`)
    );
    // Case for ID of male dog provided
    const maleId = {
      breederId,
      dam: { id: utils.randomDog({ sex: 'm' }).id },
    };
    const maleIdRes = await request(app).post('/litters').send(maleId);
    expect(maleIdRes.statusCode).toEqual(400);
    expect(maleIdRes.body).toEqual({});
    expect(maleIdRes.text).toEqual(
      expect.stringContaining(`Dog with ID ${maleId.dam.id} is male`)
    );
    // Case for bad name provided
    const badName = {
      breederId,
      dam: { name: 8 },
    };
    const badNameRes = await request(app).post('/litters').send(badName);
    expect(badNameRes.statusCode).toEqual(400);
    expect(badNameRes.body).toEqual({});
    expect(badNameRes.text).toEqual(
      expect.stringContaining(
        'Dam information should be an object containing at least one of a valid dog id or the name of a dog'
      )
    );
    // Case for no dam info sent at all
    const noInfo = {
      breederId,
      but: 'technicallythereissomeinfo',
    };
    const noInfoRes = await request(app).post('/litters').send(noInfo);
    expect(noInfoRes.statusCode).toEqual(400);
    expect(noInfoRes.body).toEqual({});
    expect(noInfoRes.text).toEqual(expect.stringContaining('dam'));
  });
});
