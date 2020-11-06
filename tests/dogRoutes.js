// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Tests assume database contains exact data as set up in databaseSetup.js
// So directly import the data used, do compare!
import { breeders, dogs } from './databaseSetup';

/*
 * GET
 */
describe('GET /dogs endpoints', () => {
  test('GET /dogs', async () => {
    const res = await request(app).get('/dogs');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toEqual(5); // 5 dogs in test suite
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
 * POST
 */
// Commented out until I get a test database up and running!
// describe('POST /dogs endpoints', () => {
//   test('Creates a dog from valid data', async () => {
//     const dogData = {
//       breed: 'unicorn dog',
//       color: 'rainbow',
//       name: 'TestDog',
//       weight: 1,
//     };
//     const createdDogRes = await request(app).post('/dogs').send(dogData);
//     expect(createdDogRes.statusCode).toEqual(201);
//     // Check returned data
//     console.log(createdDogRes.body);
//     // const createdDog = createdDogRes.body;
//     // expect(createdDog.breed).toEqual(dogData.breed);
//     // expect(createdDog.color).toEqual(dogData.color);
//     // expect(createdDog.name).toEqual(dogData.name);
//     // expect(createdDog.weight).toEqual(dogData.weight);
//     // expect(createdDog).toHaveProperty('id');
//     // expect(createdDog).toHaveProperty('breederId');
//
//     // Cleanup!
//     const deleted = await request(app).delete(`/dogs/${createdDogRes.body.id}`);
//     expect(deleted.statusCode).toEqual(200);
//   });
// });

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
