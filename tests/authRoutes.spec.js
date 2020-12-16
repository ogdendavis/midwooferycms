// Import supertest and API app
import request from 'supertest';
import app from '../src/server';

// Utils to bring in helpers and data from which database was created
import utils from './setup/utils';

describe('Login functionality', () => {
  test('Returns valid response for correct login', async () => {
    const testBreeder = utils.randomBreeder();
    const password = utils.getPassword(testBreeder.id);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testBreeder.email, password });
    expect(res.statusCode).toEqual(200);
    // User object should match breeder info in database, with some properties stripped out
    expect(res.body.user).toEqual(
      expect.objectContaining({
        id: testBreeder.id,
        firstname: testBreeder.firstname,
        lastname: testBreeder.lastname,
        email: testBreeder.email,
      })
    );
    // Token response will be 3 encoded strings, joined by .
    expect(res.body.token).toEqual(
      expect.stringMatching(/^[\w-]*\.[\w-]*.[\w-]*$/)
    );
  });

  test('Returns valid response for bad password', async () => {
    const testBreeder = utils.randomBreeder();
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testBreeder.email, password: '' });
    expect(res.statusCode).toEqual(401);
    expect(res.text).toEqual('Failed Login');
  });

  test('Returns 404 for invalid user', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'bademail', password: '' });
    expect(res.statusCode).toEqual(404);
    expect(res.text).toEqual(expect.stringContaining('credentials'));
  });
});
