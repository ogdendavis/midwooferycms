// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Tests assume database contains exact data as set up in databaseSetup.js
// So directly import the data used, do compare!
import { breeders, dogs } from './setup/databaseSetup';

/*
 * GET
 */
describe('GET /dogs endpoints', () => {
  test('GET /dogs', async () => {
    const res = await request(app).get('/dogs');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toEqual(dogs.length);
    // Check that a random dog has all fields
    const dog = randomFromArray(res.body);
    expect(dog).toBeInstanceOf(Object);
    expect(dog).toEqual(
      expect.objectContaining({
        id: expect.anything(),
        breed: expect.anything(),
        color: expect.anything(),
        name: expect.anything(),
        weight: expect.anything(),
        breederId: expect.anything(),
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      })
    );
    //Check that a random known dog exists
    const knownDog = randomDog();
    expect(res.body).toContainEqual(expect.objectContaining(knownDog));
  });

  test('GET /dogs/:dogId', async () => {
    const testDog = randomDog();
    // Test good data first
    const oneDogRes = await request(app).get(`/dogs/${testDog.id}`);
    const oneDog = oneDogRes.body;
    expect(oneDogRes.statusCode).toEqual(200);
    expect(oneDog).toEqual(testDog);
    // Now check a bad request
    const badDogRes = await request(app).get('/dogs/iamnotavalidid');
    expect(badDogRes.statusCode).toEqual(404);
  });

  test('GET /dogs/:dogId/breeder', async () => {
    const testDog = randomDog();
    const breederRes = await request(app).get(`/dogs/${testDog.id}/breeder`);
    expect(breederRes.statusCode).toEqual(200);
    // Check that breeder matches known data
    const breeder = breederRes.body;
    const testBreeder = breeders.filter((b) => b.id === testDog.breederId)[0];
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

describe('POST /dogs endpoint', () => {
  test('Creates a dog from valid data', async () => {
    const dogData = {
      id: 'ud',
      name: 'Wildfire',
      breed: 'unicorn dog',
      color: 'rainbow',
      weight: 1,
      breederId: 'b2',
    };
    const res = await request(app).post('/dogs').send(dogData);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        ...dogData,
        createdAt: expect.anything(),
        updatedAt: expect.anything(),
      })
    );
  });

  test('Creates a dog from valid partial data', async () => {
    const partyDog = {
      name: 'Audi',
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
        breederId: null,
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
});

/*
 * PUT
 */

describe('PUT /dogs endpoints', () => {
  test('Updates with valid input', async () => {
    const dogToUpdate = randomDog();
    const dogUpdates = {
      name: 'Ziggy',
      weight: 999,
      breed: 'zoomdog',
      color: 'racing stripes',
      breederId: 'b3',
    };
    const res = await request(app)
      .put(`/dogs/${dogToUpdate.id}`)
      .send(dogUpdates);
    expect(res.statusCode).toEqual(200);
    // Correct fields logged as updated
    expect(res.body.updated).toEqual(Object.keys(dogUpdates));
    // And correct values in those fields
    expect(res.body.result).toEqual(
      expect.objectContaining({ ...dogUpdates, id: dogToUpdate.id })
    );
  });

  test('Rejects change to dog ID', async () => {
    const dogToUpdate = randomDog();
    const badUpdate = {
      id: 'dontchangemebro',
    };
    const res = await request(app)
      .put(`/dogs/${dogToUpdate.id}`)
      .send(badUpdate);
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(expect.stringContaining('id'));
  });

  test('Extraneous or invalid changes cause entire request rejection', async () => {
    const dogToUpdate = randomDog();
    const mixedUpdate = {
      name: 'Fred', // valid
      id: 'nopez', // field exists, but should be immutable
      fakezorz: 'trogdor', // field doesn't exist on dog model
    };
    // Test 'em all!
    const res1 = await request(app)
      .put(`/dogs/${dogToUpdate.id}`)
      .send(mixedUpdate);
    expect(res1.statusCode).toEqual(400);
    expect(res1.text).toEqual(expect.stringContaining('id fakezorz'));
    // Now withoutt ID
    const res2 = await request(app)
      .put(`/dogs/${dogToUpdate.id}`)
      .send({ name: mixedUpdate.name, fakies: mixedUpdate.fakezorz });
    expect(res2.statusCode).toEqual(400);
    expect(res2.text).toEqual(expect.stringContaining('fakies'));
  });
});

/*
 * DELETE
 */
describe('DELETE /dogs endpoint', () => {
  test('Deletes a dog', async () => {
    const testDog = randomDog();
    const res = await request(app).delete(`/dogs/${testDog.id}`);
    expect(res.statusCode).toEqual(200);
    // Should get back a response with the deleted dog info
    expect(res.body).toEqual(expect.objectContaining(testDog));
    // Dog should not be in the database
    const getRes = await request(app).get(`/dogs/${testDog.id}`);
    expect(getRes.statusCode).toEqual(404);
  });

  test('Fails with bad ID', async () => {
    const res = await request(app).delete(`/dogs/iamnotavalidid`);
    // Expect a 404 response
    expect(res.statusCode).toEqual(404);
    // Database should still have all dogs
    const getRes = await request(app).get(`/dogs`);
    expect(getRes.body.length).toEqual(dogs.length);
  });
});

/*
 * Helper functions
 */

// Get a random item from an array
const randomFromArray = (ar) => {
  return ar[Math.floor(Math.random() * ar.length)];
};

const randomDog = () => {
  return {
    ...randomFromArray(dogs),
    createdAt: expect.anything(),
    updatedAt: expect.anything(),
  };
};
