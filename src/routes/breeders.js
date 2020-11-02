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
  return res.send(`No breeder with ID ${req.params.breederId}`);
});

// Get all of a breeder's dogs
router.get('/:breederId/dogs', async (req, res) => {
  const breeder = await req.context.models.Breeder.findByPk(
    req.params.breederId
  );
  if (breeder) {
    const dogs = await breeder.getDogs();
    return dogs
      ? res.send(dogs)
      : `No dogs listed for breeder ${req.params.breederId}`;
  }
  return res.send(`No breeder with ID ${req.params.breederId}`);
});

// Create a breeder
router.post('/', async (req, res) => {
  // Check for required fields
  if (!req.body.firstname || !req.body.lastname) {
    return res.send('Please enter a first and last name');
  }
  // Generate an id, and create an object with the breeder info
  const id = uuidv4();
  const newBreeder = await req.context.models.Breeder.create({
    id,
    ...(req.body.firstname && { firstname: req.body.firstname }),
    ...(req.body.lastname && { lastname: req.body.lastname }),
    ...(req.body.city && { city: req.body.city }),
    ...(req.body.state && { state: req.body.state }),
  });

  // Send the newly created breeder back to confirm
  return res.send(newBreeder);
});

// Update a breeder by ID
router.put('/:breederId', async (req, res) => {
  const breederRes = await req.context.models.Breeder.findByPk(
    req.params.breederId
  );
  if (!breederRes) {
    return res.send(`No breeder with ID ${req.params.breederId}`);
  }

  // Surface the data from the return object
  const breeder = breederRes.dataValues;

  // Create an object to hold updates, and filter out unwanted ones
  const updates = { ...req.body };
  for (const key in updates) {
    if (key === 'id' || !breeder.hasOwnProperty(key)) {
      delete updates[key];
    }
  }

  // Send the updates, and get back the udpated breeder object
  const updatedBreeder = await req.context.models.Breeder.update(updates, {
    where: { id: req.params.breederId },
    returning: true,
  });

  // Surface actual data in returned object from update, and send it back to confirm
  return res.send(updatedBreeder[1][0]);
});

// Delete a breeder by ID
router.delete('/:breederId', async (req, res) => {
  const breederRes = await req.context.models.Breeder.findByPk(
    req.params.breederId
  );
  if (!breederRes) {
    return res.send(`No breeder with ID ${req.params.breederId}`);
  }

  // Make a copy of the breeder to be deleted
  const byeByeBreeder = await req.context.models.Breeder.findByPk(
    req.params.breederId
  );
  // Delete it!
  req.context.models.Breeder.destroy({ where: { id: req.params.breederId } });
  // Send back a copy of the deleted breeder to confirm
  return res.send(byeByeBreeder);
});

export default router;
