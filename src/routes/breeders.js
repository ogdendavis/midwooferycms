import Router from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all breeders
router.get('/', async (req, res) => {
  const breeders = await req.context.models.Breeder.findAll();
  return res.send(breeders);
});

// Get one breeder by id
router.get('/:breederId', async (req, res) => {
  const breeder = await req.context.models.Breeder.findByPk(
    req.params.breederId
  );
  if (breeder) {
    return res.send(breeder);
  }
  return res
    .status(404)
    .send(
      `(Status code ${res.statusCode}) No breeder with ID ${req.params.breederId}`
    );
});

// Get all of a breeder's dogs
router.get('/:breederId/dogs', async (req, res) => {
  const breeder = await req.context.models.Breeder.findByPk(
    req.params.breederId
  );
  if (breeder) {
    const dogs = await breeder.getDogs();
    return dogs.length > 0
      ? res.send(dogs)
      : res
          .status(204)
          .send(
            `(Status code ${res.statusCode}) No dogs listed for breeder ${req.params.breederId}`
          );
  }
  return res
    .status(404)
    .send(
      `(Status code ${res.statusCode}) No breeder with ID ${req.params.breederId}`
    );
});

// Get all of a breeder's litters
router.get('/:breederId/litters', async (req, res) => {
  const breeder = await req.context.models.Breeder.findByPk(
    req.params.breederId
  );
  if (breeder) {
    const litters = await breeder.getLitters();
    return litters.length > 0
      ? res.send(litters)
      : res
          .status(204)
          .send(
            `(Status code ${res.statusCode}) No litters listed for breeder ${req.params.breederId}`
          );
  }
  return res
    .status(404)
    .send(
      `(Status code ${res.statusCode}) No breeder with ID ${req.params.breederId}`
    );
});

// Create a breeder
router.post('/', async (req, res) => {
  try {
    // Check for required fields
    if (!req.body.firstname || !req.body.lastname) {
      return res
        .status(400)
        .send(
          `(Status code ${res.statusCode}) Please enter a first and last name`
        );
    }
    // If ID is provided, make sure it's unique
    if (req.body.id) {
      const existing = await req.context.models.Breeder.findByPk(req.body.id);
      if (existing) {
        return res
          .status(400)
          .send(
            `(Status code ${res.statusCode}) A breeder with id ${req.body.id} already exists`
          );
      }
    }
    // Generate an id, if not given, and create an object with the breeder info
    const id = req.body.id || uuidv4();
    const newBreeder = await req.context.models.Breeder.create({
      ...req.body,
      id,
    });

    // Send the newly created breeder back to confirm
    return res.status(201).send(newBreeder);
  } catch (er) {
    return res
      .status(500)
      .send(`(Status code ${res.statusCode}) Error processing request: ${er}`);
  }
});

// Update a breeder by ID
router.put('/:breederId', async (req, res) => {
  const breederRes = await req.context.models.Breeder.findByPk(
    req.params.breederId
  );
  if (!breederRes) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No breeder with ID ${req.params.breederId}`
      );
  }

  // Surface the data from the return object
  const breeder = breederRes.dataValues;

  // Any invalid updates sent should cancel the entire update and return a useful message
  const [badKeys, goodKeys] = [[], []];
  for (const key in req.body) {
    // Don't allow changes to ID
    if (key === 'id' || !breeder.hasOwnProperty(key)) {
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
        }) Attempted to update invalid fields: ${badKeys.join(', ')}`
      );
  }

  // Send the updates, and get back the udpated breeder object
  const updatedBreeder = await req.context.models.Breeder.update(req.body, {
    where: { id: req.params.breederId },
    returning: true,
  });

  // Surface actual data in returned object from update, and send it back to confirm
  return res.send({ updated: goodKeys, result: updatedBreeder[1][0] });
});

// Delete a breeder by ID
router.delete('/:breederId', async (req, res) => {
  const breeder = await req.context.models.Breeder.findByPk(
    req.params.breederId
  );
  if (!breeder) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No breeder with ID ${req.params.breederId}`
      );
  }

  // Get the dogs associated with the breeder -- they'll be deleted, too
  const byeDogs = await breeder.getDogs();
  if (byeDogs.length > 0) {
    for (const d of byeDogs) {
      req.context.models.Dog.destroy({ where: { id: d.id } });
    }
  }

  // Delete it!
  req.context.models.Breeder.destroy({ where: { id: req.params.breederId } });
  // Send back a copy of the deleted breeder to confirm
  return res.send({ breeder, dogs: byeDogs });
});

export default router;
