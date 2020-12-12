import Router from 'express';

const router = Router();

import controllers from '../controllers';

// Get all breeders
router.get('/', controllers.get.all);

// Get one breeder by id
router.get(
  '/:breederId',
  controllers.auth.checkBreederToken,
  controllers.get.byId
);

// Get all of a breeder's dogs
router.get('/:breederId/dogs', controllers.get.associated);

// Get all of a breeder's litters
router.get('/:breederId/litters', controllers.get.associated);

// Create a breeder
router.post('/', controllers.post.create);

// Restore a previously deleted breeder
router.post('/:breederId/restore', controllers.post.restore);

// Update a breeder by ID
router.put('/:breederId', controllers.put.updateOne);

// Delete a breeder by ID
router.delete('/:breederId', controllers.del.deleteOne);

export default router;
