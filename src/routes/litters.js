import Router from 'express';

const router = Router();

import controllers from '../controllers';

// Get basic info on all litters
// As model grows, needs to be refined down to basic stats. Should probably eventually be eliminated altogether
router.get('/', controllers.auth.tokenExists, controllers.get.all);

// Get one litter by id
router.get('/:litterId', controllers.auth.checkToken, controllers.get.byId);

// Get the listed puppies of a litter by id
router.get(
  '/:litterId/pups',
  controllers.auth.checkToken,
  controllers.get.associated
);

// Get the breeder of a litter by id
router.get(
  '/:litterId/breeder',
  controllers.auth.checkToken,
  controllers.get.associated
);

// Create a new litter
router.post('/', controllers.auth.checkCreationToken, controllers.post.create);

// Restore a previously deleted litter
router.post(
  '/:litterId/restore',
  controllers.auth.checkToken,
  controllers.post.restore
);

// Update a litter by id
router.put(
  '/:litterId',
  controllers.auth.checkToken,
  controllers.put.updateOne
);

// Delete a litter by ID
router.delete(
  '/:litterId',
  controllers.auth.checkToken,
  controllers.del.deleteOne
);

export default router;
