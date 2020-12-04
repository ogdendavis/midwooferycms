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
router.put('/:litterId', async (req, res, next) => {
  const litterRes = await req.context.models.Litter.findByPk(
    req.params.litterId
  ).catch(next);
  if (!litterRes) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No litter with ID ${req.litterId}`
      );
  }

  // Surface the actual values from the sequelize request
  const litter = litterRes.dataValues;

  const [badKeys, goodKeys] = [[], []];
  for (const key in req.body) {
    if (key === 'id' || !litter.hasOwnProperty(key)) {
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

  // If bad breederId provided, we'll get a database error due to foreign key constraint
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

  // Check all provided fields for valid data
  const invalidFields = [];
  // Count
  if (
    req.body.count &&
    (typeof req.body.count !== 'number' || req.body.count < 0)
  ) {
    invalidFields.push('count');
  }
  // Dam
  if (
    req.body.dam &&
    !(await isValidParentData(req.context.models, req.body.dam).catch(next))
  ) {
    invalidFields.push('dam');
  }
  // Sire
  if (
    req.body.sire &&
    !(await isValidParentData(req.context.models, req.body.sire).catch(next))
  ) {
    invalidFields.push('sire');
  }
  // Pups
  if (req.body.hasOwnProperty('pups') && req.body.pups.constructor !== Array) {
    invalidFields.push('pups');
  }
  // If it is an array, we need to confirm that it contains valid IDs
  else if (req.body.hasOwnProperty('pups') && req.body.pups.length > 0) {
    if (
      !(await isValidArrayOfIDs(req.context.models.Dog, req.body.pups).catch(
        next
      ))
    ) {
      invalidFields.push('pups');
    }
  }

  if (invalidFields.length > 0) {
    return res
      .status(400)
      .send(
        `(Status code ${
          res.statusCode
        }) Litter not updated: Invalid data provided for fields: ${invalidFields.join(
          ', '
        )}`
      );
  }

  // Make the changes, and return the updated litter
  const updatedLitter = await req.context.models.Litter.update(req.body, {
    where: { id: req.params.litterId },
    returning: true,
  }).catch(next);

  // Send what was updated, and the dog info (surfaced)
  return res
    .status(200)
    .send({ updated: goodKeys, result: updatedLitter[1][0] });
});

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

// Helper function to confirm sire/dam info is valid
const isValidParentData = async (models, parent) => {
  // To confirm that names match, if we get both an ID and a name
  let confirmedName = false;
  // Check for type, ensure that it contains ID or name, and nothing else
  if (
    parent.constructor !== Object ||
    (!parent.name && !parent.id) ||
    !Object.keys(parent).every((i) => ['name', 'id'].includes(i))
  ) {
    return false;
  }
  // If parent includes ID, make sure it's valid
  if (parent.id) {
    const parentRes = await models.Dog.findByPk(parent.id);
    if (!parentRes) {
      return false;
    }
    confirmedName = parentRes.dataValues.name;
  }
  // If have both name and ID, make sure they match
  if (confirmedName && parent.name && confirmedName !== parent.name) {
    return false;
  }
  // If we get here, we have a name but no ID
  if (
    parent.name &&
    (typeof parent.name !== 'string' || parent.name.length < 2)
  ) {
    return false;
  }
  return true;
};

// Helper function to test all elements of pups array
const isValidArrayOfIDs = async (model, arr) => {
  for (const i of arr) {
    if (typeof i !== 'string') {
      return false;
    }
    const res = await model.findByPk(i);
    if (!res) {
      return false;
    }
  }
  return true;
};

export default router;
