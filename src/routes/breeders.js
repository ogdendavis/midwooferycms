import Router from 'express';

const router = Router();

import controllers from '../controllers';

// Get all breeders
router.get('/', controllers.get.all);

// Get one breeder by id
router.get('/:breederId', controllers.auth.checkToken, controllers.get.byId);

// Get all of a breeder's dogs
router.get(
  '/:breederId/dogs',
  controllers.auth.checkToken,
  controllers.get.associated
);

// Get all of a breeder's litters
router.get(
  '/:breederId/litters',
  controllers.auth.checkToken,
  controllers.get.associated
);

// Create a breeder
router.post('/', controllers.post.create);

// Restore a previously deleted breeder
router.post(
  '/:breederId/restore',
  controllers.auth.checkToken,
  controllers.post.restore
);

// Update a breeder by ID
router.put(
  '/:breederId',
  controllers.auth.checkToken,
  controllers.put.updateOne
);

// Delete a breeder by ID
router.delete(
  '/:breederId',
  controllers.auth.checkToken,
  controllers.del.deleteOne
);

export default router;
