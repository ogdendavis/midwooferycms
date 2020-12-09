// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Utils to bring in helpers and data from which database was created
import utils from './setup/utils';

// Varaibles for quick access to allBreeders from utils
// Capitalized to remind that this is the source of truth
const Breeders = utils.allBreeders();

/*
 * GET
 */

describe('GET /breeders endpoints', () => {
  test('GET /breeders', async () => {
    const res = await request(app).get('/breeders');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(Breeders);
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
    // Get a breeder that we know to have dogs
    const testBreeder = utils.randomBreeder({ hasDogs: true });
    // Pull all dogs that are associated with the test breeder
    const testDogs = utils.allDogs({ breederId: testBreeder.id });
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

  test('GET /breeders/:breederId/litters for breeder with litters', async () => {
    const testBreeder = utils.randomBreeder({ hasLitters: true });
    const testLitters = utils.allLitters({ breederId: testBreeder.id });
    const res = await request(app).get(`/breeders/${testBreeder.id}/litters`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(testLitters);
  });

  test('GET /breeders/:breederId/litters for breeder without litters', async () => {
    const testBreeder = utils.randomBreeder({ hasLitters: false });
    const res = await request(app).get(`/breeders/${testBreeder.id}/litters`);
    // Successful request, but no litters, so return 204
    expect(res.statusCode).toEqual(204);
    expect(res.body).toEqual({});
  });

  test('GET /breeders/:breederId/litters for bad breeder id', async () => {
    const res = await request(app).get(
      '/breeders/mynameisinigomontoya/litters'
    );
    expect(res.statusCode).toEqual(404);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('No breeder with ID'));
  });
});

/*
 * POST
 */

describe('POST /breeders endpoints', () => {
  test('Creates a breeder from valid data', async () => {
    const data = {
      id: 'imaginativenewid',
      firstname: 'Jane',
      lastname: 'Lorna',
      city: 'Houston',
      state: 'LA',
      email: 'iaman@email.address.com',
      password: '12345',
    };
    const res = await request(app).post('/breeders').send(data);
    expect(res.statusCode).toEqual(201);
    expect(res.body).toEqual(utils.dataize(data));
  });

  test('Creates a breeder from valid partial data', async () => {
    const data = {
      firstname: 'Firsty',
      lastname: 'McFirsterson',
      email: 'fake@email.com',
      password: 'supersercure',
    };
    // Just send the minimum -- first and last names, email and pw
    const res = await request(app).post('/breeders').send(data);
    expect(res.statusCode).toEqual(201);
    expect(res.body.firstname).toEqual(data.firstname);
    expect(res.body.lastname).toEqual(data.lastname);
    // Check that other fields were createdAt
    expect(res.body.id).toBeDefined();
    expect(res.body.state).toEqual('');
    expect(res.body.city).toEqual('');
  });

  test('Fails if no email sent', async () => {
    const data = {
      firstname: 'Fred',
      lastname: 'Flinstone',
      password: 'onetwothree',
    };
    const res = await request(app).post('/breeders').send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('email'));
  });

  test('Fails if email not unique', async () => {
    const testEmail = utils.randomBreeder()['email'];
    const data = {
      firstname: 'Fred',
      lastname: 'Flinstone',
      password: 'onetwothree',
      email: testEmail,
    };
    const res = await request(app).post('/breeders').send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('email'));
  });

  test("Fails if email isn't a valid address", async () => {
    const data = {
      firstname: 'Fred',
      lastname: 'Flinstone',
      password: 'onetwothree',
      email: '9',
    };
    const res = await request(app).post('/breeders').send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('email'));
  });

  test('Fails if no password sent', async () => {
    const data = {
      firstname: 'Fred',
      lastname: 'Flinstone',
      email: 'freddy@flinstonesdonthaveemail.com',
    };
    const res = await request(app).post('/breeders').send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('password'));
  });

  test('Fails if bad key sent in update object', async () => {
    const badData = {
      id: 'idontexist',
      firstname: 'Fred',
      transport: 'footcar',
    };
    const res = await request(app).post('/breeders').send(badData);
    expect(res.statusCode).toEqual(400);
    // Make sure breeder wasn't created
    const getRes = await request(app).get(`/breeders/${badData.id}`);
    expect(getRes.statusCode).toEqual(404);
    expect(getRes.body).toEqual({});
  });

  test('Rejects a request with already-used ID', async () => {
    const testBreeder = utils.randomBreeder();
    const dupeBreeder = {
      id: testBreeder.id,
      firstname: 'Elvis',
      lastname: 'Presley',
      password: 'boof',
      email: 'boo@fakemail.com',
    };
    const res = await request(app).post('/breeders').send(dupeBreeder);
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(expect.stringContaining(`id ${dupeBreeder.id}`));
  });

  // Endpoint to restore a deleted breeder, plus associated dogs/litters
  test('POST /breeders/:breederId/restore restores deleted breeder with dogs & litters', async () => {
    // Get a known breeder with litters and dogs
    const testBreeder = utils.randomBreeder({
      hasDogs: true,
      hasLitters: true,
    });
    // Get copies of the litters and dogs, too
    const testLitters = utils.allLitters({ breederId: testBreeder.id });
    const testDogs = utils.allDogs({ breederId: testBreeder.id });
    // Delete the breeder and quickly confirm via status codes
    const deleteRes = await request(app).delete(`/breeders/${testBreeder.id}`);
    expect(deleteRes.statusCode).toEqual(200);
    // Now, undelete the breeder!
    const res = await request(app).post(`/breeders/${testBreeder.id}/restore`);
    expect(res.statusCode).toEqual(201);
    expect(res.body.breeder).toEqual(testBreeder);
    expect(res.body.dogs).toEqual(testDogs);
    expect(res.body.litters).toEqual(testLitters);
    // And double-check with quick GETs
    const getRes = await request(app).get(`/breeders/${testBreeder.id}`);
    expect(getRes.statusCode).toEqual(200);
    const getDogRes = await request(app).get(
      `/breeders/${testBreeder.id}/dogs`
    );
    expect(getDogRes.statusCode).toEqual(200);
    const getLitterRes = await request(app).get(
      `/breeders/${testBreeder.id}/litters`
    );
    expect(getLitterRes.statusCode).toEqual(200);
    // Make sure dogs and litters are back at their respective endpoints
    const recheckDogRes = await request(app).get(
      `/dogs/${utils.randomFromArray(testDogs).id}`
    );
    expect(recheckDogRes.statusCode).toEqual(200);
    expect(testDogs).toContainEqual(recheckDogRes.body);
    const recheckLitterRes = await request(app).get(
      `/litters/${utils.randomFromArray(testLitters).id}`
    );
    expect(recheckLitterRes.statusCode).toEqual(200);
    expect(testLitters).toContainEqual(recheckLitterRes.body);
  });

  test('POST /breeders/:breederId/restore restores deleted breeder with no dogs or litters', async () => {
    const testBreeder = utils.randomBreeder({
      hasDogs: false,
      hasLitters: false,
    });
    const deleteRes = await request(app).delete(`/breeders/${testBreeder.id}`);
    expect(deleteRes.statusCode).toEqual(200);
    const res = await request(app).post(`/breeders/${testBreeder.id}/restore`);
    expect(res.statusCode).toEqual(201);
    expect(res.body.breeder).toEqual(testBreeder);
    expect(res.body.dogs).toEqual([]);
    expect(res.body.litters).toEqual([]);
    const getRes = await request(app).get(`/breeders/${testBreeder.id}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body).toEqual(testBreeder);
  });

  test('POST /breeders/:breederId/restore ignores active breeder', async () => {
    const testBreeder = utils.randomBreeder();
    const res = await request(app).post(`/breeders/${testBreeder.id}/restore`);
    expect(res.statusCode).toEqual(405);
    expect(res.text).toEqual(
      expect.stringContaining(
        `Breeder with ID ${testBreeder.id} is already active`
      )
    );
  });

  test('POST /breeders/:breederId/restore rejects bad id', async () => {
    const res = await request(app).post(`/breeders/wakkawakkawakka/restore`);
    expect(res.statusCode).toEqual(404);
    expect(res.text).toEqual(expect.stringContaining(`No breeder with ID`));
  });
});

/*
 * PUT
 */

describe('PUT /breeders endpoints', () => {
  test('Should update a valid breeder with valid updtes', async () => {
    const updates = {
      firstname: 'Richard',
      lastname: 'Incognito',
      city: 'Anywhere',
      state: 'USA',
      email: 'completelyuniqueemail@gmale.net',
    };
    const testBreeder = utils.randomBreeder();
    const res = await request(app)
      .put(`/breeders/${testBreeder.id}`)
      .send(updates);
    expect(res.statusCode).toEqual(200);
    // Updated object should show all fields in data as being updated
    expect(res.body.updated).toEqual(Object.keys(updates));
    // Should have updated the correct ID
    expect(res.body.result.id).toEqual(testBreeder.id);
    // And the data should match!
    for (const key in Object.keys(updates)) {
      expect(res.body.result[key]).toEqual(updates[key]);
    }
    // Confirm that the data matches on a follow-up GET request
    const getRes = await request(app).get(`/breeders/${testBreeder.id}`);
    expect(getRes.body).toEqual(res.body.result);
  });

  test('Rejects change to non-unique email', async () => {
    // Get one breeder with litters and one without, so we know we're getting two different breeders to compare
    const breederOne = utils.randomBreeder({ hasLitters: true });
    const breederTwo = utils.randomBreeder({ hasLitters: false });
    // Flip a coin to see which one is control and which is experiment
    const [testBreeder, ctlBreeder] =
      Math.random() < 0.5 ? [breederOne, breederTwo] : [breederTwo, breederOne];
    const data = {
      email: ctlBreeder.email,
    };
    const res = await request(app)
      .put(`/breeders/${testBreeder.id}`)
      .send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('email'));
  });

  test('Rejects invalid email address update', async () => {
    const testBreeder = utils.randomBreeder();
    const data = {
      email: 'tobeornottobe',
    };
    const res = await request(app)
      .put(`/breeders/${testBreeder.id}`)
      .send(data);
    expect(res.statusCode).toEqual(400);
    expect(res.body).toEqual({});
    expect(res.text).toEqual(expect.stringContaining('email'));
  });

  test('Correctly updates and hashes password', async () => {
    /* TODO */
    // Not sure how to test this, or if I even can before setting up Passport.js
  });

  test('Rejects attempted ID change', async () => {
    const badUpdate = { id: 'bwahaha' };
    const testBreeder = utils.randomBreeder();
    const res = await request(app)
      .put(`/breeders/${testBreeder.id}`)
      .send(badUpdate);
    expect(res.statusCode).toEqual(400);
    expect(res.text).toEqual(expect.stringContaining('id'));
  });

  test('Any bad change invalidates entire update', async () => {
    const mixedUpdate = {
      city: 'Utopia', // valid
      id: 'burninator', // should be immutable
      favorite_color: 'blue', // doesn't exist
    };
    const testBreeder = utils.randomBreeder();
    // Should reject with all sent
    const res1 = await request(app)
      .put(`/breeders/${testBreeder.id}`)
      .send(mixedUpdate);
    expect(res1.statusCode).toEqual(400);
    expect(res1.text).toEqual(expect.stringContaining('id, favorite_color'));
    // Should reject without ID sent
    const res2 = await request(app).put(`/breeders/${testBreeder.id}`).send({
      city: mixedUpdate.city,
      favorite_color: mixedUpdate.favorite_color,
    });
    expect(res2.statusCode).toEqual(400);
    expect(res2.text).toEqual(expect.stringContaining('favorite_color'));
    // Make sure city wasn't changed!
    const getRes = await request(app).get(`/breeders/${testBreeder.id}`);
    expect(getRes.body.city).not.toEqual(mixedUpdate.city);
  });
});

/*
 * DELETE
 */

describe('DELETE /dogs endpoint', () => {
  test('Deletes a breeder', async () => {
    const testBreeder = utils.randomBreeder();
    const res = await request(app).delete(`/breeders/${testBreeder.id}`);
    expect(res.statusCode).toEqual(200);
    // Response should show that the correct breeder has been removed
    expect(res.body.breeder).toEqual(testBreeder);
    // We shouldn't be able to find the breeder with a GET request
    const getRes = await request(app).get(`/breeders/${testBreeder.id}`);
    expect(getRes.statusCode).toEqual(404);
    expect(getRes.body).toEqual({});
    // And we should have one less breeder overall
    const getAllRes = await request(app).get('/breeders');
    expect(getAllRes.body.length).toEqual(Breeders.length - 1);
  });

  test('Fails with bad ID', async () => {
    const res = await request(app).delete('/breeders/bb8');
    expect(res.statusCode).toEqual(404);
    // GET should show all breeders
    const getRes = await request(app).get('/breeders');
    expect(getRes.body.length).toEqual(Breeders.length);
  });

  test('Breeder deletion also deletes associated dogs', async () => {
    const testBreeder = utils.randomBreeder({ hasDogs: true });
    const testDogs = utils.allDogs({ breederId: testBreeder.id });
    const resB = await request(app).delete(`/breeders/${testBreeder.id}`);
    // Check that breeder deletion returns dog data
    expect(resB.body.dogs).toEqual(testDogs);
    // Try to get all dogs from breeder -- since breeder is gone, should get 404
    const resD = await request(app).get(`/breeders/${testBreeder.id}/dogs`);
    expect(resD.statusCode).toEqual(404);
    expect(resD.body).toEqual({});
    // Try to get each individual dog -- they shouldn't be there!
    for (const td of testDogs) {
      const res = await request(app).get(`/dogs/${td.id}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({});
    }
  });

  test('Breeder deletion also deletes associated litters', async () => {
    const testBreeder = utils.randomBreeder({ hasLitters: true });
    const testLitters = utils.allLitters({ breederId: testBreeder.id });
    const resB = await request(app).delete(`/breeders/${testBreeder.id}`);
    // Check that deletion return includes litter data
    expect(resB.body.litters).toEqual(testLitters);
    // Try to get all litters from breeder -- since breeder is deleted, should get 404
    const resL = await request(app).get(`/breeders/${testBreeder.id}/litters`);
    expect(resL.statusCode).toEqual(404);
    expect(resL.body).toEqual({});
    // Check litters endpoints, too
    for (const tl of testLitters) {
      const res = await request(app).get(`/litters/${tl.id}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body).toEqual({});
    }
  });
});
