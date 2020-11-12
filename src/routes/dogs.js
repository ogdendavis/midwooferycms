import Router from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all dogs
router.get('/', async (req, res) => {
  const dogs = await req.context.models.Dog.findAll();
  return res.send(dogs);
});

// Get one dog by id
router.get('/:dogId', async (req, res) => {
  const dog = await req.context.models.Dog.findByPk(req.params.dogId);
  if (dog) {
    return res.send(dog);
  }
  return res
    .status(404)
    .send(`(Status code ${res.statusCode}) No dog with ID ${req.params.dogId}`);
});

// Get a dog's breeder
router.get('/:dogId/breeder', async (req, res) => {
  const dog = await req.context.models.Dog.findByPk(req.params.dogId);
  if (dog) {
    const breeder = await dog.getBreeder();
    return breeder
      ? res.send(breeder)
      : res
          .status(404)
          .send(
            `(Status code ${res.statusCode}) No breeder listed for ${dog.name}`
          );
  }
  return res
    .status(404)
    .send(`(Status code ${res.statusCode}) No dog with ID ${req.params.dogId}`);
});

// Create a dog
router.post('/', async (req, res) => {
  try {
    // Check for required input
    if (!req.body.name || !req.body.breederId) {
      const missing = [
        !req.body.name && 'name',
        !req.body.breederId && 'breederId',
      ];

      return res
        .status(400)
        .send(
          `(Status code ${
            res.statusCode
          }) Dog not created. Missing required field(s): ${missing.join(' ')}`
        );
    }
    // Make sure breederId provided is valid
    const breeder = await req.context.models.Breeder.findByPk(
      req.body.breederId
    );
    if (!breeder) {
      return res
        .status(400)
        .send(
          `(Status code ${res.statusCode}) Invalid breederId: ${req.body.breederId}`
        );
    }
    // Make sure ID (if provided) is unique
    if (req.body.id) {
      const existingDog = await req.context.models.Dog.findByPk(req.body.id);
      if (existingDog) {
        return res
          .status(400)
          .send(
            `(Status code ${res.statusCode}) A dog already exists with id ${req.body.id}`
          );
      }
    }
    // Generate random ID for the new dog, if one not provided
    const id = req.body.id || uuidv4();
    // Make the new dog, and add it to the database
    const newDog = await req.context.models.Dog.create({
      ...req.body,
      id, // last to overwrite, if needed
    });

    // Confirm by sending the new dog back to the user with status code indicating resource creation
    return res.status(201).send(newDog);
  } catch (er) {
    return res
      .status(500)
      .send(`(Status code ${res.statusCode}) Error processing request: ${er}`);
  }
});

// Update a dog by ID
router.put('/:dogId', async (req, res) => {
  const dogRes = await req.context.models.Dog.findByPk(req.params.dogId);
  if (!dogRes) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No dog with ID ${req.params.dogId}`
      );
  }

  // Sequelize returns an object with the actual data wrapped under dataValues, so surface that to easily use!
  const dog = dogRes.dataValues;

  // Any invalid updates in the body should cancel the entire request
  // Remember what is updated, and what's invalid, to return useful message
  const [badKeys, goodKeys] = [[], []];
  for (const key in req.body) {
    if (key === 'id' || !dog.hasOwnProperty(key)) {
      badKeys.push(key);
    } else {
      goodKeys.push(key);
    }
  }
  if (badKeys.length > 0) {
    return res
      .status(400)
      .send(
        `(Status code ${
          res.statusCode
        }) Attempted to update inalid fields: ${badKeys.join(' ')}`
      );
  }

  // Send the updates, and get back the updated dog
  const updatedDog = await req.context.models.Dog.update(req.body, {
    where: { id: req.params.dogId },
    returning: true,
  });

  // Send updated dog back to confirm -- it's a little buried in a return array, so surface it
  return res.send({ updated: goodKeys, result: updatedDog[1][0] });
});

// Delete a dog by ID
router.delete('/:dogId', async (req, res) => {
  const dogRes = await req.context.models.Dog.findByPk(req.params.dogId);
  if (!dogRes) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No dog with ID ${req.params.dogId}`
      );
  }
  // Get a copy of the dog to be deleted
  const deadDog = await req.context.models.Dog.findByPk(req.params.dogId);
  // Do the deleting
  req.context.models.Dog.destroy({ where: { id: req.params.dogId } });
  // Send back a copy of the deleted dog
  return res.send(deadDog);
});

export default router;
