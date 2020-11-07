// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Utils to bring in helpers and data from which database was created
import utils from './setup/utils';

// Varaibles for quick access to allBreeders from utils
// Capitalized to remind that this is the source of truth
const Breeders = utils.allBreeders();

describe('GET /breeders endpoints', () => {
  test('GET /breeders', async () => {
    const res = await request(app).get('/breeders');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toEqual(Breeders.length);
    // Test that a random breeder matches a known breeder exactly
    const rando = utils.randomFromArray(res.body);
    expect(rando).toBeInstanceOf(Object);
    expect(Breeders).toContainEqual(rando);
  });

  test('GET /breeders/:breederId', async () => {
    const testBreeder = utils.randomBreeder();
    // Check a good request first
    const res = await request(app).get(`/breeders/${testBreeder.id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testBreeder);
    // Now check a bad one!
    const badRes = await request(app).get('/breeders/eeniemeenie');
    expect(badRes.statusCode).toEqual(404);
    expect(Breeders).not.toContainEqual(badRes.body);
  });

  test('GET /breeders/:breederId/dogs for breeder with dogs', async () => {
    // Get a breeder that we know to have dogs by working backwards from dog to breeder
    const testBreederId = utils.randomDog().breederId;
    const testBreeder = Breeders.filter((b) => b.id === testBreederId)[0];
    // Pull all dogs that are associated with the test breeder
    const testDogs = utils
      .allDogs()
      .filter((d) => d.breederId === testBreederId);
    // Check the database!
    const res = await request(app).get(`/breeders/${testBreeder.id}/dogs`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testDogs);
  });

  test('GET /breeders/:breederId/dogs for breeder without dogs', async () => {
    // We know that the breeder with id b3 has no dogs when the database is created
    const testBreeder = Breeders.filter((b) => b.id === 'b3')[0];
    const res = await request(app).get(`/breeders/${testBreeder.id}/dogs`);
    expect(res.statusCode).toEqual(204); // Indicates successful request returning no data
    expect(res.body).toEqual({}); // Empty object
  });

  test('GET /breeders/:breederId/dogs for bad breeder id', async () => {
    const badRes = await request(app).get('/breeders/nopezorz/dogs');
    expect(badRes.statusCode).toEqual(404);
    expect(badRes.text).toEqual(expect.stringContaining('No breeder with ID'));
  });
});
