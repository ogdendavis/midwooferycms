import Router from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get basic info on all litters
// As model grows, needs to be refined down to basic stats. Should probably eventually be eliminated altogether
router.get('/', async (req, res, next) => {
  const litters = await req.context.models.Litter.findAll().catch(next);
  return res.send(litters);
});

// Get one litter by id
router.get('/:litterId', async (req, res, next) => {
  const litter = await req.context.models.Litter.findByPk(
    req.params.litterId
  ).catch(next);
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
router.get('/:litterId/pups', async (req, res, next) => {
  // First, grab the indicated litter
  const litter = await req.context.models.Litter.findByPk(
    req.params.litterId
  ).catch(next);
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
    }).catch(next);
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
router.get('/:litterId/breeder', async (req, res, next) => {
  const litter = await req.context.models.Litter.findByPk(
    req.params.litterId
  ).catch(next);
  // Early return if litter isn't there
  if (!litter) {
    return res
      .status(404)
      .send(
        `(Status code ${res.statusCode}) No litter with ID ${req.params.litterId}`
      );
  }
  // Get the breeder
  const breeder = await litter.getBreeder().catch(next);
  // Breeder should always exist, but just in case...
  if (!breeder) {
    return res
      .status(404)
      .send(`(Status code ${res.statusCode}) No breeder found for this litter`);
  }
  return res.send(breeder);
});

// Create a new litter
router.post('/', async (req, res, next) => {
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
  // Create the litter id first -- we'll need it to add to pups later
  const id = req.body.id || uuidv4();
  // Confirm that breederId is valid
  const breeder = await req.context.models.Breeder.findByPk(
    req.body.breederId
  ).catch(next);
  if (!breeder) {
    return res
      .status(400)
      .send(
        `(Status code ${res.statusCode}) Litter not created. Invalid breederId: ${req.body.breederId}`
      );
  }
  // Confirm that dam info is valid
  if (req.body.dam.hasOwnProperty('id')) {
    // Case for if an ID is provided
    const damInDB = await req.context.models.Dog.findByPk(
      req.body.dam.id
    ).catch(next);
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
  // If pups are indicated, update the litterId on the pups
  if (req.body.hasOwnProperty('pups') && req.body.pups.length > 0) {
    for (const p of req.body.pups) {
      const pup = await req.context.models.Dog.findByPk(p).catch(next);
      // Only returns first invalid ID, but I'm ok with that for now
      if (!pup) {
        return res
          .status(400)
          .send(
            `(Status code ${res.statusCode}) Litter not created. Invalid Dog ID ${p} in pups array`
          );
      }
      if (pup.litterId !== '') {
        // Assume litterId is valid, as we have checks for that elsewhere
        return res
          .status(400)
          .send(
            `(Status code ${res.statusCode}) Litter not created. Dog with ID ${p} already belongs to another litter`
          );
      }
      // If we get here, pup is valid!
      await pup.update({ litterId: id }).catch(next);
    }
  }
  // We have the info, so now make the litter!
  const newLitter = await req.context.models.Litter.create({
    ...req.body,
    id,
  }).catch(next);
  return res.status(201).send(newLitter);
});

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
