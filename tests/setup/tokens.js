import jwt from 'jsonwebtoken';

// Need breeder data to get tokens to authenticate requests
import { breeders, superuser } from './data';

const createTokens = () => {
  const tokens = {};
  // Extract IDs and use them to build tokens
  const ids = [superuser.id, ...breeders.map((b) => b.id)];
  ids.forEach((id) => {
    const token = jwt.sign(
      {
        id,
        ...(id === 'super' && { superuser: true }),
      },
      process.env.JWT_KEY
    );
    tokens[id] = token;
  });
  return tokens;
};

export default createTokens;
