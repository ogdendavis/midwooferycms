import Router from 'express';

const router = Router();

import controllers from '../controllers';

// Get basic info on all litters
// As model grows, needs to be refined down to basic stats. Should probably eventually be eliminated altogether
router.get('/', controllers.get.all);

// Get one litter by id
router.get('/:litterId', controllers.get.byId);

// Get the listed puppies of a litter by id
router.get('/:litterId/pups', controllers.get.associated);

// Get the breeder of a litter by id
router.get('/:litterId/breeder', controllers.get.associated);

// Create a new litter
router.post('/', controllers.post.create);

// Restore a previously deleted litter
router.post('/:litterId/restore', controllers.post.restore);

// Update a litter by id
router.put('/:litterId', controllers.put.update);

// Delete a litter by ID
router.delete('/:litterId', async (req, res, next) => {
  const litter = await req.context.models.Litter.findByPk(
    req.params.litterId
  ).catch(next);
  if (!litter) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No litter with ID ${req.params.litterId}`
      );
  }
  // Delete the litter
  await litter.destroy().catch(next);
  // If there are pups in the litter, go find them and remove the litterId
  if (litter.pups.length > 0) {
    await req.context.models.Dog.update(
      { litterId: '' },
      { where: { id: litter.pups } }
    );
  }
  // Send back a copy of the deleted litter
  return res.send(litter);
});

export default router;
