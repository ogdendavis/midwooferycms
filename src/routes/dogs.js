import Router from 'express';
// import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Import controllers
import controllers from '../controllers';

// Get all dogs
router.get('/', controllers.get.all);

// Get one dog by id
router.get('/:dogId', controllers.get.byId);

// Get a dog's breeder
router.get('/:dogId/breeder', controllers.get.associated);

// Create a dog
router.post('/', controllers.post.create);

// Restore a deleted dog
router.post('/:dogId/restore', controllers.post.restore);

// Update a dog by ID
router.put('/:dogId', controllers.put.updateOne);

// Delete a dog by ID
router.delete('/:dogId', controllers.del.deleteOne);

export default router;
