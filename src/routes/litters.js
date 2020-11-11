import Router from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get basic info on all litters
// As model grows, needs to be refined down to basic stats. Should probably eventually be eliminated altogether
router.get('/', async (req, res) => {
  const litters = await req.context.models.Litter.findAll();
  return res.send(litters);
});

// Get one litter by id
router.get('/:litterId', async (req, res) => {
  const litter = await req.context.models.Litter.findByPk(req.params.litterId);
  if (litter) {
    return res.send(litter);
  }
  return res
    .status(404)
    .send(
      `(Status code ${res.statusCode}) No litter with ID ${req.params.litterId}`
    );
});

// Get the listed puppies of a litter by id
router.get('/:litterId/pups', async (req, res) => {
  // First, grab the indicated litter
  const litter = await req.context.models.Litter.findByPk(req.params.litterId);
  // Early return if litter isn't there
  if (!litter) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No litter with ID ${req.params.litterId}`
      );
  }
  // Don't search if no pups are listed
  if (litter.pups.length > 0) {
    const pups = await req.context.models.Dog.findAll({
      where: { litterId: req.params.litterId },
    });
    // Check if the pups are actually there...
    if (pups) {
      return res.send(pups);
    }
  }
  // If no pups listed, indicate that!
  return res
    .status(204)
    .send(`(Status code ${res.statusCode}) No pups found for this litter`);
});

export default router;
