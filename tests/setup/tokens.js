// Import supertest and API app
import request from 'supertest';
import app from '../../src/server';

// Need breeder data to get tokens to authenticate requests
import { breeders, superuser } from './data';

// Get tokens to validate the users!
const createTokens = async () => {
  const tokens = {};
  await Promise.all(
    [...breeders, superuser].map(async (b) => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: b.email, password: b.password });
      tokens[b.id] = res.text;
    })
  );
  return tokens;
};

export default createTokens;
