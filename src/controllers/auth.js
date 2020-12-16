import jwt from 'jsonwebtoken';

import utils from './utils';

const auth = {
  login: async (req, res, next) => {
    // Find the breeder, early return if not found
    const breeder = await req.context.models.Breeder.findOne({
      where: { email: req.body.email },
    }).catch(next);
    if (!breeder) {
      return res.status(404).send('No user found with those credentials');
    }
    // Check the password
    const correctPassword = breeder.passwordCheck(req.body.password);
    // Generate the token and return it, if successful
    if (correctPassword) {
      // If user is superuser, add that info to the jwt
      const payload = {
        id: breeder.id,
        ...(breeder.superuser && { superuser: breeder.superuser }),
      };
      jwt.sign(payload, process.env.JWT_KEY, (err, token) => {
        if (err) {
          return res.status(500).send(err);
        } else {
          const userObj = utils.sanitizeBreederObj(breeder.dataValues);
          // Strip out update info
          delete userObj.createdAt;
          delete userObj.updatedAt;
          delete userObj.deletedAt;
          return res.send({
            user: userObj,
            token,
          });
        }
      });
    } else {
      return res.status(401).send('Failed Login');
    }
  },

  checkToken: async (req, res, next) => {
    // Validates and authorizes requests to act on existing assets
    const token = extractToken(req.headers);
    if (!token) {
      return res.status(401).send('Missing token');
    }
    jwt.verify(token, process.env.JWT_KEY, async (err, user) => {
      if (err) {
        // console.error(err);
        return res.status(500).send(err);
      } else {
        // Workflow for modifying existing assets
        // Grab info and asset -- we'll need them for verification, and can pass them to next handler to reduce queries
        const info = utils.getAssetInfo(req);
        const asset = await info.model.findByPk(info.id, { paranoid: false });
        // If asset doesn't exist, or if you're trying to do anything other than restore with a deleted asset, return a 404
        if (!asset || isFetchingDeletedAsset(req, asset)) {
          return res
            .status(404)
            .send(`(Status code 404) No ${info.noun} with ID ${info.id}`);
        }
        req.asset = asset;
        req.assetInfo = info;
        // Superusers can do anything they want!
        // Otherwise, id of breeder in JWT should match breederID of asset
        if (!user.superuser && !isBreederAuthorized(user, asset.dataValues)) {
          return res.status(403).send('Token does not match breederId');
        }
        req.user = user;
        next();
      }
    });
  },

  checkCreationToken: async (req, res, next) => {
    // Validates and authorizes requests to create assets
    const token = extractToken(req.headers);
    if (!token) {
      return res.status(401).send('Missing token');
    }
    jwt.verify(token, process.env.JWT_KEY, async (err, user) => {
      if (err) {
        // console.error(err);
        return res.status(500).send(err);
      } else if (req.body.breederId !== user.id && !user.superuser) {
        return res.status(403).send('Token does not match breederId');
      }
      // If we get here, the breederId in the request matches the user token (or user is superuser), so we can pass the request along to the creation handler
      next();
    });
  },

  tokenExists: async (req, res, next) => {
    // Basic check for any valid token associated with any breeder
    const token = extractToken(req.headers);
    if (!token) {
      return res.status(401).send('Missing token');
    }
    jwt.verify(token, process.env.JWT_KEY, async (err, user) => {
      if (err) {
        return res.status(500).send(err);
      } else {
        const breeder = await req.context.models.Breeder.findByPk(user.id);
        if (!breeder) {
          return res.status(403).send('invalid token');
        }
      }
      next();
    });
  },
};

// Accepts headers, returns a token
const extractToken = (headers) => {
  const { authorization } = headers;
  return authorization && authorization.split(' ')[1];
};

// Accepts user object and req, returns whether or not user is authorized to perform req
const isBreederAuthorized = (user, asset) => {
  // Breeder is always allowed to access self
  if (user.id === asset.id) {
    return true;
  }
  // dogs and litters are accessible to their breeders
  else if (asset.hasOwnProperty('breederId')) {
    return user.id === asset.breederId;
  }
  // We should only get here when trying to access a breeder record with a token for a different breeder
  return false;
};

// Accepts req and asset, returns true if asset is deleted and you're trying to do anything other than restore it
const isFetchingDeletedAsset = (req, asset) => {
  const isRestoring =
    req.method === 'POST' && req.route.path.split('/').pop() === 'restore';
  return asset.dataValues.deletedAt && !isRestoring;
};

export default auth;
