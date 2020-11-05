// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Tests assume that at least one dog exists in the database

/*
 * GET
 */
describe('GET /dogs endpoints', () => {
  test('GET /dogs', async () => {
    const res = await request(app).get('/dogs');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    const dog = randomFromArray(res.body);
    expect(dog).toBeInstanceOf(Object);
    expect(dog).toHaveProperty('id');
    expect(dog).toHaveProperty('breed');
    expect(dog).toHaveProperty('color');
    expect(dog).toHaveProperty('name');
    expect(dog).toHaveProperty('weight');
    expect(dog).toHaveProperty('breederId');
  });

  test('GET /dogs/:dogId', async () => {
    const testDog = await randomDog();
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
    const testDog = await randomDog();
    const breederRes = await request(app).get(`/dogs/${testDog.id}/breeder`);
    expect(breederRes.statusCode).toEqual(200);
    const breeder = breederRes.body;
    expect(breeder).toHaveProperty('id');
    expect(breeder).toHaveProperty('firstname');
    expect(breeder).toHaveProperty('lastname');
    // Check bad request
    const badBreederRes = await request(app).get('/dogs/123456789/breeder');
    expect(badBreederRes.statusCode).toEqual(404);
  });
});

/*
 * Helper functions
 */

// Get a random item from an array
const randomFromArray = (ar) => {
  return ar[Math.floor(Math.random() * ar.length)];
};

// Get a random dog from the database
const randomDog = async () => {
  const allDogsRes = await request(app).get('/dogs');
  const allDogs = allDogsRes.body;
  const oneDogRes = await request(app).get(
    `/dogs/${randomFromArray(allDogs).id}`
  );
  return oneDogRes.body;
};
