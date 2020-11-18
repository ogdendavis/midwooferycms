import Router from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all dogs
router.get('/', async (req, res, next) => {
  const dogs = await req.context.models.Dog.findAll().catch(next);
  return res.send(dogs);
});

// Get one dog by id
router.get('/:dogId', async (req, res, next) => {
  const dog = await req.context.models.Dog.findByPk(req.params.dogId).catch(
    next
  );
  if (dog) {
    return res.send(dog);
  }
  return res
    .status(404)
    .send(`(Status code ${res.statusCode}) No dog with ID ${req.params.dogId}`);
});

// Get a dog's breeder
router.get('/:dogId/breeder', async (req, res, next) => {
  const dog = await req.context.models.Dog.findByPk(req.params.dogId).catch(
    next
  );
  if (dog) {
    const breeder = await dog.getBreeder().catch(next);
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
router.post('/', async (req, res, next) => {
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
  ).catch(next);
  if (!breeder) {
    return res
      .status(400)
      .send(
        `(Status code ${res.statusCode}) Invalid breederId: ${req.body.breederId}`
      );
  }
  // Make sure ID (if provided) is unique
  if (req.body.hasOwnProperty('id')) {
    const existingDog = await req.context.models.Dog.findByPk(
      req.body.id
    ).catch(next);
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
  }).catch(next);

  // Confirm by sending the new dog back to the user with status code indicating resource creation
  return res.status(201).send(newDog);
});

// Restore a deleted dog
router.post('/:dogId/restore', async (req, res, next) => {
  // Check for active dog
  const activeDog = await req.context.models.Dog.findByPk(
    req.params.dogId
  ).catch(next);
  if (activeDog) {
    return res
      .status(405)
      .send(
        `(Status code ${res.statusCode}) Dog with ID ${req.params.dogId} is already active`
      );
  }
  // Check for deleted dog
  const dog = await req.context.models.Dog.findByPk(req.params.dogId, {
    paranoid: false,
  }).catch(next);
  if (!dog) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No dog with ID ${req.params.breederId} found in deleted dogs`
      );
  }
  // Now restore the dog!
  await dog.restore().catch(next);
  // Add the dog back to its litter, if it has one
  if (dog.dataValues.litterId !== '') {
    const litter = await req.context.models.Litter.findByPk(
      dog.dataValues.litterId
    ).catch(next);
    await litter
      .update({ pups: litter.pups.concat([dog.dataValues.id]) })
      .catch(next);
  }
  // Send the successful response
  return res.status(201).send(dog.dataValues);
});

// Update a dog by ID
router.put('/:dogId', async (req, res, next) => {
  const dogRes = await req.context.models.Dog.findByPk(req.params.dogId).catch(
    next
  );
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
        }) Attempted to update inalid fields: ${badKeys.join(', ')}`
      );
  }

  // If breeder is being updated, make sure it's valid!
  if (req.body.hasOwnProperty('breederId')) {
    const breederRes = await req.context.models.Breeder.findByPk(
      req.body.breederId
    ).catch(next);
    if (!breederRes) {
      return res
        .status(400)
        .send(
          `(Status code ${res.statusCode}) Can't update breederId: No breeder with ID ${req.body.breederId}`
        );
    }
  }
  // If litterId is being updated, make the appropriate changes to the litter(s)
  if (req.body.hasOwnProperty('litterId')) {
    // Remove from old litter first
    const oldLitter = await req.context.models.Litter.findByPk(
      dog.litterId
    ).catch(next);
    if (oldLitter) {
      await oldLitter
        .update({
          pups: oldLitter.pups.filter((p) => p !== dog.id),
        })
        .catch(next);
    }
    // If the dog is being reassigned to a new litter, update that
    if (req.body.litterId !== '') {
      const newLitter = await req.context.models.Litter.findByPk(
        req.body.litterId
      ).catch(next);
      // Reject the update if new litterId isn't valid
      if (!newLitter) {
        return res
          .status(400)
          .send(
            `(Status code ${res.statusCode}) Can't update litterId: No litter with ID ${req.body.breederId}`
          );
      }
      // Add the dog's id to the new litter's pups array
      await newLitter
        .update({ pups: newLitter.pups.concat([dog.id]) })
        .catch(next);
    }
  }

  // Send the updates, and get back the updated dog
  const updatedDog = await req.context.models.Dog.update(req.body, {
    where: { id: req.params.dogId },
    returning: true,
  }).catch(next);

  // Send updated dog back to confirm -- it's a little buried in a return array, so surface it
  return res.send({ updated: goodKeys, result: updatedDog[1][0] });
});

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
