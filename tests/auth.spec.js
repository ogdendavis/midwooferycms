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
      .send({ id: testBreeder.id, password });
    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual('Successful Login');
  });

  test('Returns valid response for bad login', async () => {
    const testBreeder = utils.randomBreeder();
    const res = await request(app)
      .post('/auth/login')
      .send({ id: testBreeder.id, password: '' });
    expect(res.statusCode).toEqual(403);
    expect(res.text).toEqual('Failed Login');
  });
});
