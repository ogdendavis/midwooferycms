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
router.put('/:dogId', controllers.put.update);

// Delete a dog by ID
router.delete('/:dogId', async (req, res, next) => {
  const dog = await req.context.models.Dog.findByPk(req.params.dogId).catch(
    next
  );
  if (!dog) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No dog with ID ${req.params.dogId}`
      );
  }
  if (dog.litterId !== '') {
    const litter = await req.context.models.Litter.findByPk(dog.litterId).catch(
      next
    );
    await litter
      .update({ pups: litter.pups.filter((p) => p !== dog.id) })
      .catch(next);
  }
  // Do the deleting
  await dog.destroy().catch(next);
  // Send back a copy of the deleted dog
  return res.send(dog);
});

export default router;
