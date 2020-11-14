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
    const testLitter = utils.randomLitter({ hasPups: true });
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

/*
 * PUT
 */

describe('PUT /litters endpoints', () => {
  test('Correctly executes valid updates', async () => {
    // change all the data that we can!
    const data = {
      breederId: 'b3',
      count: 1,
      dam: { id: 'd1' },
      sire: { name: 'Andrew' },
      pups: ['d2'],
    };
    const testLitter = utils.randomLitter();
    const res = await request(app).put(`/litters/${testLitter.id}`).send(data);
    expect(res.statusCode).toEqual(200);
    expect(res.body.updated).toEqual(Object.keys(data));
    expect(res.body.result).toEqual({ ...testLitter, ...data });
  });

  test('Rejects update to non-existent litter', async () => {
    const data = {
      id: 'notanid',
      count: 5,
    };
    // Only send the valid update (count) from data
    const res = await request(app)
      .put(`/litters/${data.id}`)
      .send({ count: data.count });
    expect(res.statusCode).toEqual(404);
    expect(res.text).toEqual(expect.stringContaining('No litter with ID'));
  });

  test('Rejects attempt to update ID', async () => {
    const data = {
      id: 'shouldntupdate',
      sire: { name: 'Arthur' },
    };
    const testLitter = utils.randomLitter();
    const res = await request(app).put(`/litters/${testLitter.id}`).send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(expect.stringContaining('id'));
  });

  test('Rejects updates with non-existent fields', async () => {
    const data = {
      does: 'notexist',
      realField: false,
    };
    const testLitter = utils.randomLitter();
    const res = await request(app).put(`/litters/${testLitter.id}`).send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(expect.stringContaining('does, realField'));
  });

  test('Rejects update with invalid breederId', async () => {
    const testLitter = utils.randomLitter();
    const res = await request(app).put(`/litters/${testLitter.id}`).send({
      breederId: 'imaginary',
    });
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(expect.stringContaining('No breeder with ID'));
  });

  test('Rejects update with bad count', async () => {
    const testLitter = utils.randomLitter();
    const stringCount = {
      count: 'iamastring',
    };
    // Case: non-number provided for count
    const stringCountRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .send(stringCount);
    expect(stringCountRes.statusCode).toEqual(400);
    expect(stringCountRes.body).toEqual({});
    expect(stringCountRes.text).toEqual(expect.stringContaining('count'));
    // Case: negative number provided for count
    const negCount = {
      count: -1,
    };
    const negCountRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .send(negCount);
    expect(negCountRes.statusCode).toEqual(400);
    expect(negCountRes.body).toEqual({});
    expect(negCountRes.text).toEqual(expect.stringContaining('count'));
    // Confirm that test litter hasn't changed
    const getRes = await request(app).get(`/litters/${testLitter.id}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body).toEqual(testLitter);
  });

  test('Rejects update with bad dam info', async () => {
    const testLitter = utils.randomLitter();
    // Case: Dam is not an object
    const stringDam = {
      dam: 'stringy',
    };
    const stringDamRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .send(stringDam);
    expect(stringDamRes.statusCode).toEqual(400);
    expect(stringDamRes.body).toEqual({});
    expect(stringDamRes.text).toEqual(expect.stringContaining('dam'));
    // Case: Dam object contains invalid ID
    const badId = {
      dam: { id: 'notanid' },
    };
    const badIdRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .send(badId);
    expect(badIdRes.statusCode).toEqual(400);
    expect(badIdRes.body).toEqual({});
    expect(badIdRes.text).toEqual(expect.stringContaining('dam'));
    // Case: Dam object contains invalid name
    const badName = {
      dam: { name: 'a' },
    };
    const badNameRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .send(badName);
    expect(badNameRes.statusCode).toEqual(400);
    expect(badNameRes.body).toEqual({});
    expect(badNameRes.text).toEqual(expect.stringContaining('dam'));
    // Case: Dam objects contains both name and ID, but they don't match
    const noMatch = {
      dam: {
        id: utils.randomDog({ sex: 'f' }).id,
        name: '***There is no dog with this name***',
      },
    };
    expect(badNameRes.statusCode).toEqual(400);
    expect(badNameRes.body).toEqual({});
    expect(badNameRes.text).toEqual(expect.stringContaining('dam'));
    // Case: Dam object contains neither name nor ID
    const noIdOrName = {
      dam: { quest: 'make_puppies' },
    };
    const noIdOrNameRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .send(noIdOrName);
    expect(noIdOrNameRes.statusCode).toEqual(400);
    expect(noIdOrNameRes.body).toEqual({});
    expect(noIdOrNameRes.text).toEqual(expect.stringContaining('dam'));
    // Confirm that test litter hasn't changed
    const getRes = await request(app).get(`/litters/${testLitter.id}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body).toEqual(testLitter);
  });

  test('Rejects update with bad sire info', async () => {
    const testLitter = utils.randomLitter();
    // Case: Sire is not an object
    const stringSire = {
      sire: 'stringy',
    };
    const stringSireRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .send(stringSire);
    expect(stringSireRes.statusCode).toEqual(400);
    expect(stringSireRes.body).toEqual({});
    expect(stringSireRes.text).toEqual(expect.stringContaining('sire'));
    // Case: Sire object contains bad ID
    const badId = {
      sire: { id: 'notanid' },
    };
    const badIdRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .send(badId);
    expect(badIdRes.statusCode).toEqual(400);
    expect(badIdRes.body).toEqual({});
    expect(badIdRes.text).toEqual(expect.stringContaining('sire'));
    // Case: Sire object contains bad name
    const badName = {
      sire: { name: 999 },
    };
    const badNameRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .send(badName);
    expect(badNameRes.statusCode).toEqual(400);
    expect(badNameRes.body).toEqual({});
    expect(badNameRes.text).toEqual(expect.stringContaining('sire'));
    // Case: Sire object contains neither ID nor name
    const noIdOrName = {
      sire: { quest: 'make_puppies' },
    };
    const noIdOrNameRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .send(noIdOrName);
    expect(noIdOrNameRes.statusCode).toEqual(400);
    expect(noIdOrNameRes.body).toEqual({});
    expect(noIdOrNameRes.text).toEqual(expect.stringContaining('sire'));
    // Confirm that test litter hasn't changed
    const getRes = await request(app).get(`/litters/${testLitter.id}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body).toEqual(testLitter);
  });

  test('Rejects updates with bad pup info', async () => {
    const testLitter = utils.randomLitter();
    // Case: Pups is not an array
    const stringPup = { pups: 'ishouldbeanarray' };
    const stringPupRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .send(stringPup);
    expect(stringPupRes.statusCode).toEqual(400);
    expect(stringPupRes.body).toEqual({});
    expect(stringPupRes.text).toEqual(expect.stringContaining('pups'));
    // Case: Pups array doesn't contain all valid IDs
    const badId = {
      pups: ['d1', 'pups', 'must_have', 'only', 'valid_ids', 'd2'],
    };
    const badIdRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .send(badId);
    expect(badIdRes.statusCode).toEqual(400);
    expect(badIdRes.body).toEqual({});
    expect(badIdRes.text).toEqual(expect.stringContaining('pups'));
    // Confirm that test litter hasn't changed
    const getRes = await request(app).get(`/litters/${testLitter.id}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body).toEqual(testLitter);
  });
});

/*
 * DELETE
 */

describe('DELETE /litters endpoint', () => {
  test('Removes litter entirely', async () => {
    const targetLitter = utils.randomLitter();
    const res = await request(app).delete(`/litters/${targetLitter.id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(targetLitter);
    // Shouldn't be able to GET now-removed litter
    const getRes = await request(app).get(`/litters/${targetLitter.id}`);
    expect(getRes.statusCode).toEqual(404);
    expect(getRes.body).toEqual({});
    expect(getRes.text).toEqual(expect.stringContaining('No litter with ID'));
  });

  test('Fails if given bad ID', async () => {
    const res = await request(app).delete('/litters/junkid');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('No litter with ID'));
    // Make sure we still have all litters!
    const allRes = await request(app).get('/litters');
    expect(allRes.body).toEqual(utils.allLitters());
  });
});
