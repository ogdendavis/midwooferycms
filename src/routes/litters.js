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

// Get the breeder of a litter by id
router.get('/:litterId/breeder', async (req, res) => {
  const litter = await req.context.models.Litter.findByPk(req.params.litterId);
  // Early return if litter isn't there
  if (!litter) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No litter with ID ${req.params.litterId}`
      );
  }
  // Get the breeder
  const breeder = await req.context.models.Breeder.findByPk(litter.breederId);
  // Breeder should always exist, but just in case...
  if (!breeder) {
    return res
      .status(404)
      .send(`(Status code ${res.statusCode}) No breeder found for this litter`);
  }
  return res.send(breeder);
});

// Create a new litter
router.post('/', async (req, res) => {
  // Check for required input
  if (!req.body.breederId || !req.body.dam) {
    const missing = [
      !req.body.breederId && 'breederId',
      !req.body.dam && 'dam',
    ];
    return res
      .status(400)
      .send(
        `(Status code ${
          res.statusCode
        }) Litter not created. Missing required field(s): ${missing.join(' ')}`
      );
  }
  // Confirm that breederId is valid
  const breeder = await req.context.models.Breeder.findByPk(req.body.breederId);
  if (!breeder) {
    return res
      .status(400)
      .send(
        `(Status code ${res.statusCode}) Litter not created. Invalid breederId: ${req.body.breederId}`
      );
  }
  // Confirm that dam info is valid
  if (req.body.dam.id) {
    // Case for if an ID is provided
    const damInDB = await req.context.models.Dog.findByPk(req.body.dam.id);
    if (!damInDB) {
      return res
        .status(400)
        .send(
          `(Status code ${res.statusCode}) Litter not created. Invalid dam id: No dog found with ID ${req.body.dam.id}`
        );
    }
    if (damInDB.sex === 'm') {
      return res
        .status(400)
        .send(
          `(Status code ${res.statusCode}) Litter not created. Dog with ID ${req.body.dam.id} is male, so cannot be dam of litter`
        );
    }
  } else {
    // If an ID is not provided, check to make sure that the dam object exists, and that it has a valid name
    if (
      !req.body.dam.name ||
      typeof req.body.dam.name !== 'string' ||
      req.body.dam.name.length < 2
    ) {
      return res
        .status(400)
        .send(
          `(Status code ${res.statusCode}) Litter not created. Please provide valid dam information. Dam information should be an object containing at least one of a valid dog id or the name of a dog`
        );
    }
  }
  // We have the info, so now make the litter!
  try {
    const id = req.body.id || uuidv4();
    const newLitter = await req.context.models.Litter.create({
      ...req.body,
      id,
    });
    return res.status(201).send(newLitter);
  } catch (error) {
    return res
      .status(500)
      .send({
        message: `(Status code ${res.statusCode}) Error creating litter`,
        error,
      });
  }
  return res
    .status(500)
    .send({
      message: `(Status code ${res.statusCode}) Error creating litter`,
      error: 'unknown',
    });
});

export default router;
