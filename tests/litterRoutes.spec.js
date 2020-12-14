// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Utils to bring in helpers and data from which database was created
import utils from './setup/utils';

// Add authorization tokens to utils
import createTokens from './setup/tokens';
beforeAll(() => {
  utils.tokens = createTokens();
});

/*
 * GET
 */

describe('GET /litters endpoints', () => {
  test('GET /litters', async () => {
    const res = await request(app).get('/litters');
    expect(res.statusCode).toEqual(200);
    expect(res.body.noun).toEqual('litter');
    expect(res.body.count).toEqual(utils.allLitters().length);
  });

  test('GET /litters/:litterId with valid id', async () => {
    const testLitter = utils.randomLitter();
    const res = await request(app)
      .get(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testLitter);
  });

  test('GET /litters/:litterId with bad id', async () => {
    const res = await request(app)
      .get('/litters/notavalididatall')
      .set('Authorization', `Bearer ${utils.getToken('super')}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('No litter with ID'));
  });

  test('GET /litters/:litterId rejects request with valid but unauthorized token', async () => {
    const testLitter = utils.randomLitter();
    const otherBreeder = utils.randomBreeder({ not: testLitter.breederId });
    const res = await request(app)
      .get(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(otherBreeder.id)}`);
    expect(res.statusCode).toEqual(403);
  });

  test('GET /litters/:litterId/pups for litter with pups', async () => {
    const testLitter = utils.randomLitter({ hasPups: true });
    const testPups = utils
      .allDogs()
      .filter((d) => d.litterId === testLitter.id);
    const res = await request(app)
      .get(`/litters/${testLitter.id}/pups`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
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
    const res = await request(app)
      .get(`/litters/${testLitter.id}/pups`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(res.statusCode).toEqual(204);
    expect(res.body).toEqual({});
  });

  test('GET /litters/:litterId/pups with bad litter id', async () => {
    const res = await request(app)
      .get('/litters/notalitter/pups')
      .set('Authorization', `Bearer ${utils.getToken('super')}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({});
  });

  test('GET /litters/:litterId/pups rejects request with valid but unauthorized token', async () => {
    const testLitter = utils.randomLitter();
    const otherBreeder = utils.randomBreeder({ not: testLitter.breederId });
    const res = await request(app)
      .get(`/litters/${testLitter.id}/pups`)
      .set('Authorization', `Bearer ${utils.getToken(otherBreeder.id)}`);
    expect(res.statusCode).toEqual(403);
  });

  test('GET /litters/:litterId/breeder with valid id', async () => {
    const testLitter = utils.randomLitter();
    const testBreeder = utils
      .allBreeders()
      .filter((b) => b.id === testLitter.breederId)[0];
    const res = await request(app)
      .get(`/litters/${testLitter.id}/breeder`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testBreeder);
  });

  test('GET /litters/:litterId/breeder with bad id', async () => {
    const res = await request(app)
      .get('/litters/qwerty/breeder')
      .set('Authorization', `Bearer ${utils.getToken('super')}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('No litter with ID'));
  });

  test('GET /litters/:litterId/breeder rejects request with valid but unauthorized token', async () => {
    const testLitter = utils.randomLitter();
    const otherBreeder = utils.randomBreeder({ not: testLitter.breederId });
    const res = await request(app)
      .get(`/litters/${testLitter.id}/breeder`)
      .set('Authorization', `Bearer ${utils.getToken(otherBreeder.id)}`);
    expect(res.statusCode).toEqual(403);
  });
});

/*
 * POST
 */

describe('POST /litters endpoints', () => {
  test('Creates a litter from full data', async () => {
    const data = {
      id: 'tl',
      breederId: utils.randomBreeder().id,
      count: 10,
      dam: { id: utils.randomDog({ sex: 'f' }).id },
      sire: { name: 'Al' },
      pups: [],
    };
    const res = await request(app)
      .post('/litters')
      .set('Authorization', `Bearer ${utils.getToken(data.breederId)}`)
      .send(data);
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
    const res = await request(app)
      .post('/litters')
      .set('Authorization', `Bearer ${utils.getToken(data.breederId)}`)
      .send(data);
    expect(res.statusCode).toEqual(201);
    const expectedLitter = { ...utils.dataize(data), id: expect.anything() };
    expect(res.body).toEqual(expectedLitter);
    // Confirm that ID is valid by grabbing the litter
    const getRes = await request(app)
      .get(`/litters/${res.body.id}`)
      .set('Authorization', `Bearer ${utils.getToken(data.breederId)}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body).toEqual(expectedLitter);
  });

  test('Creates a litter from minimum required data', async () => {
    const data = {
      breederId: utils.randomBreeder().id,
      dam: { id: utils.randomDog({ sex: 'f' }).id },
    };
    const res = await request(app)
      .post('/litters')
      .set('Authorization', `Bearer ${utils.getToken(data.breederId)}`)
      .send(data);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(expect.objectContaining(data));
  });

  test('Adds litterId to dogs indicated in pups array', async () => {
    const data = {
      breederId: utils.randomBreeder().id,
      dam: { id: utils.randomDog({ sex: 'f' }).id },
      pups: [utils.randomDog({ fromLitter: false }).id],
    };
    const res = await request(app)
      .post(`/litters`)
      .set('Authorization', `Bearer ${utils.getToken(data.breederId)}`)
      .send(data);
    expect(res.statusCode).toEqual(201);
    const pRes = await request(app)
      .get(`/dogs/${data.pups[0]}`)
      .set('Authorization', `Bearer ${utils.getToken('super')}`);
    expect(pRes.body.litterId).toEqual(res.body.id);
  });

  test('Rejects litter with pup that already belongs to another litter', async () => {
    const testDog = utils.randomDog({ fromLitter: true });
    const data = {
      breederId: utils.randomBreeder().id,
      dam: { id: utils.randomDog({ sex: 'f' }).id },
      pups: [testDog.id],
    };
    const res = await request(app)
      .post(`/litters`)
      .set('Authorization', `Bearer ${utils.getToken('super')}`)
      .send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(
      expect.stringContaining(
        `Dog with ID ${testDog.id} already belongs to another litter`
      )
    );
    // Confirm that dog's litterId hasn't been changed
    const pRes = await request(app)
      .get(`/dogs/${data.pups[0]}`)
      .set('Authorization', `Bearer ${utils.getToken('super')}`);
    expect(pRes.body.litterId).toEqual(testDog.litterId);
  });

  test('Rejects litter with invalid ID in pups array', async () => {
    const data = {
      breederId: utils.randomBreeder().id,
      dam: { id: utils.randomDog({ sex: 'f' }).id },
      pups: ['tweedledeefancyfreeiswhatiwanttobee'],
    };
    const res = await request(app)
      .post(`/litters`)
      .set('Authorization', `Bearer ${utils.getToken(data.breederId)}`)
      .send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(
      expect.stringContaining(`Invalid Dog ID ${data.pups[0]} in pups array`)
    );
  });

  test('Rejects a litter without required data', async () => {
    const data = {
      sire: { name: 'Mr. Nopesies' },
      count: 33,
    };
    const res = await request(app)
      .post('/litters')
      .set('Authorization', `Bearer ${utils.getToken(data.breederId)}`)
      .send(data);
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
    const res = await request(app)
      .post('/litters')
      .set('Authorization', `Bearer ${utils.getToken('super')}`)
      .send(data);
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
    const badIdRes = await request(app)
      .post('/litters')
      .set('Authorization', `Bearer ${utils.getToken(breederId)}`)
      .send(badId);
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
    const maleIdRes = await request(app)
      .post('/litters')
      .set('Authorization', `Bearer ${utils.getToken(breederId)}`)
      .send(maleId);
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
    const badNameRes = await request(app)
      .post('/litters')
      .set('Authorization', `Bearer ${utils.getToken(breederId)}`)
      .send(badName);
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
    const noInfoRes = await request(app)
      .post('/litters')
      .set('Authorization', `Bearer ${utils.getToken(breederId)}`)
      .send(noInfo);
    expect(noInfoRes.statusCode).toEqual(400);
    expect(noInfoRes.body).toEqual({});
    expect(noInfoRes.text).toEqual(expect.stringContaining('dam'));
  });

  test('/:litterId/restore endpoint restores deleted litter', async () => {
    const testLitter = utils.randomLitter();
    const dRes = await request(app)
      .delete(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(dRes.statusCode).toEqual(200);
    const res = await request(app)
      .post(`/litters/${testLitter.id}/restore`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(res.statusCode).toEqual(201);
    const gRes = await request(app)
      .get(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(gRes.statusCode).toEqual(200);
    expect(gRes.body).toEqual(testLitter);
  });

  test('/:litterId/restore endpoint updates litterId for pups', async () => {
    const testLitter = utils.randomLitter({ hasPups: true });
    const dRes = await request(app)
      .delete(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(dRes.statusCode).toEqual(200);
    const res = await request(app)
      .post(`/litters/${testLitter.id}/restore`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(res.statusCode).toEqual(201);
    // Removal of litterId tested in DELETE below, so assume it was correctly removed on deletion, and just test that it was put back on restoration
    for (const p of testLitter.pups) {
      const pRes = await request(app)
        .get(`/dogs/${p}`)
        .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
      expect(pRes.statusCode).toEqual(200);
      expect(pRes.body.litterId).toEqual(testLitter.id);
    }
  });

  test('/:litterId/restore endpoint adds litter back to breeder list', async () => {
    const testLitter = utils.randomLitter();
    const dRes = await request(app)
      .delete(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(dRes.statusCode).toEqual(200);
    const res = await request(app)
      .post(`/litters/${testLitter.id}/restore`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(res.statusCode).toEqual(201);
    // Removal of litter from breeder list tested in DELETE below, so assume that went properly and just test re-adding on litter resetoration
    const bRes = await request(app)
      .get(`/breeders/${testLitter.breederId}/litters`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(bRes.statusCode).toEqual(200);
    expect(bRes.body).toContainEqual(testLitter);
  });

  test('/:litterId/restore endpoint ignores active litters', async () => {
    const testLitter = utils.randomLitter();
    const res = await request(app)
      .post(`/litters/${testLitter.id}/restore`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(res.statusCode).toEqual(405);
    expect(res.text).toEqual(
      expect.stringContaining(
        `Litter with ID ${testLitter.id} is already active`
      )
    );
  });

  test('/:litterId/restore endpoint fails with bad litterId', async () => {
    const res = await request(app)
      .post('/litters/notalitter/restore')
      .set('Authorization', `Bearer ${utils.getToken('super')}`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toEqual(expect.stringContaining('No litter with ID'));
  });

  test(':litterId/restore endpoint rejects request with valid but unauthorized token', async () => {
    const testLitter = utils.randomLitter();
    const otherBreeder = utils.randomBreeder({ not: testLitter.breederId });
    const delRes = await request(app)
      .delete(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(delRes.statusCode).toEqual(200);
    const res = await request(app)
      .post(`/litters/${testLitter.id}/restore`)
      .set('Authorization', `Bearer ${utils.getToken(otherBreeder.id)}`);
    expect(res.statusCode).toEqual(403);
  });
});

/*
 * PUT
 */

describe('PUT /litters endpoints', () => {
  test('Correctly executes valid updates', async () => {
    // change all the data that we can!
    const data = {
      count: 1,
      dam: { id: 'd1' },
      sire: { name: 'Andrew' },
      pups: ['d2'],
    };
    const testLitter = utils.randomLitter();
    const res = await request(app)
      .put(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
      .send(data);
    expect(res.statusCode).toEqual(200);
    expect(res.body.updated).toEqual(Object.keys(data));
    expect(res.body.result).toEqual({ ...testLitter, ...data });
  });

  test('Updates breederId if superuser requests it', async () => {
    const testLitter = utils.randomLitter();
    let testBreeder = utils.randomBreeder({ not: testLitter.breederId });
    const res = await request(app)
      .put(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken('super')}`)
      .send({ breederId: testBreeder.id });
    expect(res.statusCode).toEqual(200);
    expect(res.body.updated).toEqual(['breederId']);
    const gRes = await request(app)
      .get(`/breeders/${testBreeder.id}/litters`)
      .set('Authorization', `Bearer ${utils.getToken(testBreeder.id)}`);
    expect(gRes.body).toContainEqual({
      ...testLitter,
      breederId: testBreeder.id,
    });
  });

  test('Rejects update to breederId from non-superuser', async () => {
    const testLitter = utils.randomLitter();
    let testBreeder = utils.randomBreeder({ not: testLitter.breederId });
    const res = await request(app)
      .put(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
      .send({ breederId: testBreeder.id });
    expect(res.statusCode).toEqual(403);
    expect(res.text).toEqual(expect.stringContaining('breederId'));
  });

  test('Rejects update to non-existent litter', async () => {
    const data = {
      id: 'notanid',
      count: 5,
    };
    // Only send the valid update (count) from data
    const res = await request(app)
      .put(`/litters/${data.id}`)
      .set('Authorization', `Bearer ${utils.getToken('super')}`)
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
    const res = await request(app)
      .put(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
      .send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(expect.stringContaining('id'));
  });

  test('Rejects updates with non-existent fields', async () => {
    const data = {
      does: 'notexist',
      realField: false,
    };
    const testLitter = utils.randomLitter();
    const res = await request(app)
      .put(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
      .send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(expect.stringContaining('does, realField'));
  });

  test('Rejects update with invalid breederId', async () => {
    const testLitter = utils.randomLitter();
    const res = await request(app)
      .put(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken('super')}`)
      .send({
        breederId: 'imaginary',
      });
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(expect.stringContaining('No breeder with ID'));
  });

  test('Rejects update to breederId for non-superuser', async () => {
    const testLitter = utils.randomLitter();
    const otherBreeder = utils.randomBreeder({ not: testLitter.breederId });
    const res = await request(app)
      .put(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
      .send({ breederId: otherBreeder.id });
    expect(res.statusCode).toEqual(403);
  });

  test('Rejects update with bad count', async () => {
    const testLitter = utils.randomLitter();
    const stringCount = {
      count: 'iamastring',
    };
    // Case: non-number provided for count
    const stringCountRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
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
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
      .send(negCount);
    expect(negCountRes.statusCode).toEqual(400);
    expect(negCountRes.body).toEqual({});
    expect(negCountRes.text).toEqual(expect.stringContaining('count'));
    // Confirm that test litter hasn't changed
    const getRes = await request(app)
      .get(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
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
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
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
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
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
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
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
    const noMatchRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
      .send(noMatch);
    expect(noMatchRes.statusCode).toEqual(400);
    expect(noMatchRes.body).toEqual({});
    expect(noMatchRes.text).toEqual(expect.stringContaining('dam'));
    // Case: Dam object contains neither name nor ID
    const noIdOrName = {
      dam: { quest: 'make_puppies' },
    };
    const noIdOrNameRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
      .send(noIdOrName);
    expect(noIdOrNameRes.statusCode).toEqual(400);
    expect(noIdOrNameRes.body).toEqual({});
    expect(noIdOrNameRes.text).toEqual(expect.stringContaining('dam'));
    // Confirm that test litter hasn't changed
    const getRes = await request(app)
      .get(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
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
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
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
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
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
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
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
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
      .send(noIdOrName);
    expect(noIdOrNameRes.statusCode).toEqual(400);
    expect(noIdOrNameRes.body).toEqual({});
    expect(noIdOrNameRes.text).toEqual(expect.stringContaining('sire'));
    // Confirm that test litter hasn't changed
    const getRes = await request(app)
      .get(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body).toEqual(testLitter);
  });

  test('Rejects updates with bad pup info', async () => {
    const testLitter = utils.randomLitter();
    // Case: Pups is not an array
    const stringPup = { pups: 'ishouldbeanarray' };
    const stringPupRes = await request(app)
      .put(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
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
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`)
      .send(badId);
    expect(badIdRes.statusCode).toEqual(400);
    expect(badIdRes.body).toEqual({});
    expect(badIdRes.text).toEqual(expect.stringContaining('pups'));
    // Confirm that test litter hasn't changed
    const getRes = await request(app)
      .get(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body).toEqual(testLitter);
  });

  test('Rejects update with valid but unauthorized token', async () => {
    const testLitter = utils.randomLitter();
    const otherBreeder = utils.randomBreeder({ not: testLitter.breederId });
    const res = await request(app)
      .put(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(otherBreeder.id)}`)
      .send({ count: 20 });
    expect(res.statusCode).toEqual(403);
  });
});

/*
 * DELETE
 */

describe('DELETE /litters endpoint', () => {
  test('Removes litter entirely', async () => {
    const testLitter = utils.randomLitter();
    const res = await request(app)
      .delete(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testLitter);
    // Shouldn't be able to GET now-removed litter
    const getRes = await request(app)
      .get(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(getRes.statusCode).toEqual(404);
    expect(getRes.body).toEqual({});
    expect(getRes.text).toEqual(expect.stringContaining('No litter with ID'));
  });

  test('Removes litterId from dogs in pups', async () => {
    const testLitter = utils.randomLitter({ hasPups: true });
    const res = await request(app)
      .delete(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(res.statusCode).toEqual(200);
    for (const pup of testLitter.pups) {
      const pRes = await request(app)
        .get(`/dogs/${pup}`)
        .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
      expect(pRes.body.litterId).toEqual('');
    }
  });

  test('Removes litter from breeder list', async () => {
    const testLitter = utils.randomLitter();
    const res = await request(app)
      .delete(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(res.statusCode).toEqual(200);
    const bRes = await request(app)
      .get(`/breeders/${testLitter.breederId}/litters`)
      .set('Authorization', `Bearer ${utils.getToken(testLitter.breederId)}`);
    expect(bRes.body).not.toContainEqual(testLitter);
  });

  test('Fails if given bad ID', async () => {
    const res = await request(app)
      .delete('/litters/junkid')
      .set('Authorization', `Bearer ${utils.getToken('super')}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('No litter with ID'));
    // Make sure we still have all litters!
    const allRes = await request(app).get('/litters');
    expect(allRes.body.count).toEqual(utils.allLitters().length);
  });

  test('Rejects request with valid but unauthorized token', async () => {
    const testLitter = utils.randomLitter();
    const otherBreeder = utils.randomBreeder({ not: testLitter.breederId });
    const res = await request(app)
      .delete(`/litters/${testLitter.id}`)
      .set('Authorization', `Bearer ${utils.getToken(otherBreeder.id)}`);
    expect(res.statusCode).toEqual(403);
  });
});
