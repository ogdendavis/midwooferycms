import Router from 'express';
// import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Import controllers
import controllers from '../controllers';

// Get all dogs
router.get('/', controllers.get.all);

// Get one dog by id
router.get('/:dogId', controllers.auth.checkToken, controllers.get.byId);

// Get a dog's breeder
router.get(
  '/:dogId/breeder',
  controllers.auth.checkToken,
  controllers.get.associated
);

// Create a dog
router.post('/', controllers.post.create);

// Restore a deleted dog
router.post(
  '/:dogId/restore',
  controllers.auth.checkToken,
  controllers.post.restore
);

// Update a dog by ID
router.put('/:dogId', controllers.auth.checkToken, controllers.put.updateOne);

// Delete a dog by ID
router.delete(
  '/:dogId',
  controllers.auth.checkToken,
  controllers.del.deleteOne
);

export default router;
