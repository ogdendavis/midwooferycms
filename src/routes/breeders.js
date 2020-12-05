import Router from 'express';

const router = Router();

import controllers from '../controllers';

// Get all breeders
router.get('/', controllers.get.all);

// Get one breeder by id
router.get('/:breederId', controllers.get.byId);

// Get all of a breeder's dogs
router.get('/:breederId/dogs', controllers.get.associated);

// Get all of a breeder's litters
router.get('/:breederId/litters', controllers.get.associated);

// Create a breeder
router.post('/', controllers.post.create);

// Restore a previously deleted breeder
router.post('/:breederId/restore', controllers.post.restore);

// Update a breeder by ID
router.put('/:breederId', controllers.put.update);

// Delete a breeder by ID
router.delete('/:breederId', async (req, res, next) => {
  const breeder = await req.context.models.Breeder.findByPk(
    req.params.breederId
  ).catch(next);
  if (!breeder) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No breeder with ID ${req.params.breederId}`
      );
  }

  // Get the dogs associated with the breeder -- they'll be deleted, too
  const byeDogs = await breeder.getDogs().catch(next);
  if (byeDogs.length > 0) {
    req.context.models.Dog.destroy({
      where: { id: byeDogs.map((d) => d.id) },
    }).catch(next);
  }

  // And delete associated litters, too
  const byeLitters = await breeder.getLitters();
  if (byeLitters.length > 0) {
    req.context.models.Litter.destroy({
      where: { id: byeLitters.map((l) => l.id) },
    }).catch(next);
  }

  // Delete it!
  await breeder.destroy().catch(next);
  // Send back a copy of the deleted breeder to confirm
  return res.send({ breeder, dogs: byeDogs, litters: byeLitters });
});

export default router;
