import Router from 'express';
import { v4 as uuidv4 } from 'uuid';

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
router.post('/', async (req, res, next) => {
  // Check for required fields
  if (!req.body.firstname || !req.body.lastname) {
    return res
      .status(400)
      .send(
        `(Status code ${res.statusCode}) Please enter a first and last name`
      );
  }
  // If ID is provided, make sure it's unique
  if (req.body.hasOwnProperty('id')) {
    const existing = await req.context.models.Breeder.findByPk(
      req.body.id
    ).catch(next);
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
  }).catch(next);

  // Send the newly created breeder back to confirm
  return res.status(201).send(newBreeder);
});

// Restore a previously deleted breeder
router.post('/:breederId/restore', async (req, res, next) => {
  // Check for an active breeder with the ID
  const activeBreeder = await req.context.models.Breeder.findByPk(
    req.params.breederId
  ).catch(next);
  if (activeBreeder) {
    return res
      .status(405)
      .send(
        `(Status code ${res.statusCode}) Breeder with ID ${req.params.breederId} is already active`
      );
  }
  // Check for deleted breeder
  const breeder = await req.context.models.Breeder.findByPk(
    req.params.breederId,
    { paranoid: false }
  ).catch(next);
  if (!breeder) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No breeder with ID ${req.params.breederId} found in deleted breeders`
      );
  }
  // We now have a breeder to restore!
  await breeder.restore().catch(next);
  // Get dogs and litters to restore, as well
  const dogs = await req.context.models.Dog.findAll({
    where: { breederId: req.params.breederId },
    paranoid: false,
  }).catch(next);
  for (const d of dogs) {
    await d.restore().catch(next);
  }
  const litters = await req.context.models.Litter.findAll({
    where: { breederId: req.params.breederId },
    paranoid: false,
  }).catch(next);
  for (const l of litters) {
    await l.restore().catch(next);
  }

  return res.status(201).send({ breeder, dogs, litters });
});

// Update a breeder by ID
router.put('/:breederId', async (req, res, next) => {
  const breederRes = await req.context.models.Breeder.findByPk(
    req.params.breederId
  ).catch(next);
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
  }).catch(next);

  // Surface actual data in returned object from update, and send it back to confirm
  return res.send({ updated: goodKeys, result: updatedBreeder[1][0] });
});

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
