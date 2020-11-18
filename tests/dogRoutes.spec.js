// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Utils to bring in helpers and data from which database was created
import utils from './setup/utils';

// Variable for quick access to data from allDogs in utils
// Capitalized to remind that this is the source of truth
const Dogs = utils.allDogs();

/*
 * GET
 */

describe('GET /dogs endpoints', () => {
  test('GET /dogs', async () => {
    const res = await request(app).get('/dogs');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(Dogs);
  });

  test('GET /dogs/:dogId', async () => {
    const testDog = utils.randomDog();
    // Test good data first
    const oneDogRes = await request(app).get(`/dogs/${testDog.id}`);
    const oneDog = oneDogRes.body;
    expect(oneDogRes.statusCode).toEqual(200);
    expect(oneDog).toEqual(testDog);
    // Now check a bad request
    const badDogRes = await request(app).get('/dogs/iamnotavalidid');
    expect(badDogRes.statusCode).toEqual(404);
    expect(Dogs).not.toContainEqual(badDogRes.body);
  });

  test('GET /dogs/:dogId/breeder', async () => {
    const testDog = utils.randomDog();
    const breederRes = await request(app).get(`/dogs/${testDog.id}/breeder`);
    expect(breederRes.statusCode).toEqual(200);
    // Check that breeder matches known data
    const breeder = breederRes.body;
    const testBreeder = utils
      .allBreeders()
      .filter((b) => b.id === testDog.breederId)[0];
    expect(breeder.id).toEqual(testBreeder.id);
    expect(breeder.firstname).toEqual(testBreeder.firstname);
    expect(breeder.lastname).toEqual(testBreeder.lastname);
    // Check bad request
    const badBreederRes = await request(app).get('/dogs/123456789/breeder');
    expect(badBreederRes.statusCode).toEqual(404);
  });
});

/*
 * POST
 */

describe('POST /dogs endpoints', () => {
  test('Creates a dog from valid data', async () => {
    const dogData = {
      id: 'ud',
      name: 'Wildfire',
      breed: 'unicorn dog',
      color: 'rainbow',
      weight: 1,
      breederId: 'b2',
      litterId: 'l1',
      sex: 'm',
    };
    const res = await request(app).post('/dogs').send(dogData);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(utils.dataize(dogData));
  });

  test('Creates a dog from minimum required data', async () => {
    const partyDog = {
      name: 'Audi',
      breederId: 'b3',
    };
    const res = await request(app).post('/dogs').send(partyDog);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        id: expect.anything(),
        breed: '',
        color: '',
        name: partyDog.name,
        weight: 0,
        breederId: partyDog.breederId,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      })
    );
  });

  test('Rejects invalid input', async () => {
    // Should get a 400 error if trying to make a dog with bad data
    const badDog = {
      id: 'launcelot',
      quest: 'to seek the holy grail',
    };
    const res = await request(app).post('/dogs').send(badDog);
    expect(res.statusCode).toEqual(400);

    // And the dog shouldn't have been created!
    const getRes = await request(app).get(`/dogs/${badDog.id}`);
    expect(getRes.statusCode).toEqual(404);
  });

  test('Rejects missing or invalid breederId', async () => {
    // No Breeder ID provided
    const noBID = {
      id: 'bad1',
      name: 'Lassie',
      color: 'blue',
      weight: 300,
    };
    const noRes = await request(app).post('/dogs').send(noBID);
    expect(noRes.statusCode).toEqual(400);
    expect(noRes.text).toEqual(expect.stringContaining('breederId'));

    // Bad breeder ID
    const badBID = {
      ...noBID,
      breederId:
        'thisisanonsensestringthatshouldneverendupasabreederidandifitdoesitwillbreakthistest',
    };
    const badRes = await request(app).post('/dogs').send(badBID);
    expect(badRes.statusCode).toEqual(400);
    expect(badRes.text).toEqual(expect.stringContaining('breederId'));
    expect(badRes.text).toEqual(expect.stringContaining(badBID.breederId));

    // Confim dog not in database
    const getRes = await request(app).get(`/dogs/${noBID.id}`);
    expect(getRes.statusCode).toEqual(404);
    expect(getRes.body).toEqual({});
  });

  test('Rejects a request with already-used ID', async () => {
    const testDog = utils.randomDog();
    const testBreeder = utils.randomBreeder();
    const dupeDog = {
      id: testDog.id,
      name: 'Nopey',
      breederId: testBreeder.id,
    };
    const res = await request(app).post('/dogs').send(dupeDog);
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(expect.stringContaining(`id ${dupeDog.id}`));
  });

  test('POST /dogs/:dogId/restore restores deleted dog with litter', async () => {
    const testDog = utils.randomDog({ fromLitter: true });
    const deleteRes = await request(app).delete(`/dogs/${testDog.id}`);
    expect(deleteRes.statusCode).toEqual(200);
    // Tests to confirm dog removal from litter and breeder lists are in DELETE below, so we'll just assume it worked, here
    // Now ressurect the dog!
    const res = await request(app).post(`/dogs/${testDog.id}/restore`);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(testDog);
    // Dog should now show up again in breeder's dogs listing
    const breederRes = await request(app).get(
      `/breeders/${testDog.breederId}/dogs`
    );
    expect(breederRes.body).toContainEqual(testDog);
    // And in litter's pup list
    const litterRes = await request(app).get(`/litters/${testDog.litterId}`);
    expect(litterRes.body.pups).toContainEqual(testDog.id);
  });

  test('POST /dogs/:dogId/restore restores deleted dog without litter', async () => {
    const testDog = utils.randomDog({ fromLitter: false });
    const deleteRes = await request(app).delete(`/dogs/${testDog.id}`);
    expect(deleteRes.statusCode).toEqual(200);
    // Now ressurect the dog!
    const res = await request(app).post(`/dogs/${testDog.id}/restore`);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(testDog);
    // Just to quadruple-check, no litterId has been added somehow
    expect(res.body.litterId).toEqual('');
    // Dog should now show up again in breeder's dogs listing
    const breederRes = await request(app).get(
      `/breeders/${testDog.breederId}/dogs`
    );
    expect(breederRes.body).toContainEqual(testDog);
  });

  test('POST /dogs/:dogId/restore ignores active dog', async () => {
    const testDog = utils.randomDog();
    const res = await request(app).post(`/dogs/${testDog.id}/restore`);
    expect(res.statusCode).toEqual(405);
    expect(res.text).toEqual(
      expect.stringContaining(`Dog with ID ${testDog.id} is already active`)
    );
  });
  test('POST /dogs/:dogId/restore rejects bad id', async () => {
    const res = await request(app).post('/dogs/fart/restore');
    expect(res.statusCode).toEqual(404);
    expect(res.text).toEqual(expect.stringContaining(`No dog with ID`));
  });
});

/*
 * PUT
 */

describe('PUT /dogs endpoints', () => {
  test('Updates with valid input', async () => {
    const testDog = utils.randomDog();
    const dogUpdates = {
      name: 'Ziggy',
      weight: 999,
      breed: 'zoomdog',
      color: 'racing stripes',
      breederId: 'b3',
    };
    const res = await request(app).put(`/dogs/${testDog.id}`).send(dogUpdates);
    expect(res.statusCode).toEqual(200);
    // Correct fields logged as updated
    expect(res.body.updated).toEqual(Object.keys(dogUpdates));
    // And correct values in those fields
    expect(res.body.result).toEqual(
      expect.objectContaining({ ...dogUpdates, id: testDog.id })
    );
    // Triple-check with a GET request
    const getRes = await request(app).get(`/dogs/${testDog.id}`);
    expect(getRes.body).toEqual(res.body.result);
  });

  test('Adding litterId adds dog to litter pup list', async () => {
    const testLitter = utils.randomLitter();
    const testDog = utils.randomDog({ fromLitter: false });
    const update = {
      litterId: testLitter.id,
    };
    // Make and confirm the update
    const res = await request(app).put(`/dogs/${testDog.id}`).send(update);
    expect(res.statusCode).toEqual(200);
    expect(res.body.result).toEqual({ ...testDog, ...update });
    // Get and check the litter
    const lRes = await request(app).get(`/litters/${testLitter.id}`);
    expect(lRes.body.pups).toContainEqual(testDog.id);
  });

  test('Removing litterId removes dog from litter pup list', async () => {
    const testDog = utils.randomDog({ fromLitter: true });
    const testLitter = utils.randomLitter({ pupId: testDog.id });
    const update = {
      litterId: '',
    };
    const res = await request(app).put(`/dogs/${testDog.id}`).send(update);
    expect(res.statusCode).toEqual(200);
    expect(res.body.result).toEqual({ ...testDog, ...update });
    const lRes = await request(app).get(`/litters/${testLitter.id}`);
    expect(lRes.body.pups).not.toContainEqual(testDog.id);
  });

  test('Changing litterId removes from old and adds to new pup lists', async () => {
    // Get a dog from a known litter, and change it to a known litter with no dogs
    const testDog = utils.randomDog({ fromLitter: true });
    const testLitter = utils.randomLitter({ pupId: testDog.id });
    const targetLitter = utils.randomLitter({ hasPups: false });
    const update = {
      litterId: targetLitter.id,
    };
    const res = await request(app).put(`/dogs/${testDog.id}`).send(update);
    expect(res.statusCode).toEqual(200);
    expect(res.body.result).toEqual({ ...testDog, ...update });
    const oldLitterRes = await request(app).get(`/litters/${testLitter.id}`);
    expect(oldLitterRes.body.pups).not.toContainEqual(testDog.id);
    const newLitterRes = await request(app).get(`/litters/${targetLitter.id}`);
    expect(newLitterRes.body.pups).toContainEqual(testDog.id);
  });

  test('Rejects change to dog ID', async () => {
    const testDog = utils.randomDog();
    const badUpdate = {
      id: 'dontchangemebro',
    };
    const res = await request(app).put(`/dogs/${testDog.id}`).send(badUpdate);
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(expect.stringContaining('id'));
  });

  test('Extraneous or invalid changes cause entire request rejection', async () => {
    const testDog = utils.randomDog();
    const mixedUpdate = {
      name: 'Fred', // valid
      id: 'nopez', // field exists, but should be immutable
      fakezorz: 'trogdor', // field doesn't exist on dog model
    };
    // Test 'em all!
    const res1 = await request(app)
      .put(`/dogs/${testDog.id}`)
      .send(mixedUpdate);
    expect(res1.statusCode).toEqual(400);
    expect(res1.text).toEqual(expect.stringContaining('id, fakezorz'));
    // Now without ID
    const res2 = await request(app)
      .put(`/dogs/${testDog.id}`)
      .send({ name: mixedUpdate.name, fakies: mixedUpdate.fakezorz });
    expect(res2.statusCode).toEqual(400);
    expect(res2.text).toEqual(expect.stringContaining('fakies'));
    // Confirm that name wasn't changed
    const getRes = await request(app).get(`/dogs/${testDog.id}`);
    expect(getRes.body.name).not.toEqual(mixedUpdate.name);
  });

  test('Rejects update with invalid breederId', async () => {
    const testDog = utils.randomDog();
    const res = await request(app).put(`/dogs/${testDog.id}`).send({
      breederId: 'imaginary',
    });
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(expect.stringContaining('No breeder with ID'));
  });
});

/*
 * DELETE
 */

describe('DELETE /dogs endpoint', () => {
  test('Deletes a dog', async () => {
    const testDog = utils.randomDog();
    const res = await request(app).delete(`/dogs/${testDog.id}`);
    expect(res.statusCode).toEqual(200);
    // Should get back a response with the deleted dog info
    expect(res.body).toEqual(testDog);
    // Dog should not be in the database
    const getRes = await request(app).get(`/dogs/${testDog.id}`);
    expect(getRes.statusCode).toEqual(404);
    expect(getRes.body).toEqual({});
    // Confirm that dog isn't showing in all dogs list, either
    const getAllRes = await request(app).get('/dogs');
    expect(getAllRes.body.length).toEqual(Dogs.length - 1);
  });

  test('Removes dog from associated litter', async () => {
    // Get random dog from a litter, and associated litter
    const testDog = utils.randomDog({ fromLitter: true });
    const testLitter = utils.randomLitter({ pupId: testDog.id });
    // Delete the dog
    const res = await request(app).delete(`/dogs/${testDog.id}`);
    expect(res.statusCode).toEqual(200);
    // Get the litter
    const lRes = await request(app).get(`/litters/${testLitter.id}`);
    expect(lRes.body.pups).not.toContainEqual(testDog.id);
  });

  test('Removes dog from breeder dog list', async () => {
    // All dogs have breeder
    const testDog = utils.randomDog();
    // Delete the dog
    const res = await request(app).delete(`/dogs/${testDog.id}`);
    expect(res.statusCode).toEqual(200);
    // Get the list of all the breeder's dogs
    const bRes = await request(app).get(`/breeders/${testDog.breederId}/dogs`);
    expect(bRes.body).not.toContainEqual(testDog.id);
  });

  test('Fails with bad ID', async () => {
    const res = await request(app).delete(`/dogs/iamnotavalidid`);
    // Expect a 404 response
    expect(res.statusCode).toEqual(404);
    // Database should still have all dogs
    const getRes = await request(app).get(`/dogs`);
    expect(getRes.body.length).toEqual(Dogs.length);
  });
});
