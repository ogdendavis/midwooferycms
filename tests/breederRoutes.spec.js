// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Utils to bring in helpers and data from which database was created
import utils from './setup/utils';

// Varaibles for quick access to allBreeders from utils
// Capitalized to remind that this is the source of truth
const Breeders = utils.allBreeders();

describe('GET /breeders endpoint', () => {
  test('Gets all data', async () => {
    const res = await request(app).get('/breeders');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toBeInstanceOf(Array);
    expect(res.body.length).toEqual(Breeders.length);
    // Test that a random breeder matches a known breeder exactly
    const rando = utils.randomFromArray(res.body);
    expect(rando).toBeInstanceOf(Object);
    expect(Breeders).toContainEqual(rando);
  });
});
