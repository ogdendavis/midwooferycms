import Router from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get all dogs
router.get('/', (req, res) => {
  return res.send(Object.values(req.context.models.dogs));
});

// Get one dog by id
router.get('/:dogId', (req, res) => {
  const dog = req.context.models.dogs[req.params.dogId];
  if (dog) {
    return res.send(dog);
  }
  return res.send(`No dog with ID ${req.params.dogId}`);
});

// Create a dog
router.post('/', (req, res) => {
  // Check for required input
  if (!req.body.name || !req.body.color || !req.body.weight) {
    return res.send('Please provide new dog name, color, and weight');
  }
  // Generate random ID for the new dog
  const id = uuidv4();
  // Make the new dog, and add it to the temporary store
  const newDog = {
    id,
    name: req.body.name,
    color: req.body.color,
    weight: req.body.weight,
  };
  req.context.models.dogs[id] = newDog;
  // Confirm by sending the new dog back to the user
  return res.send(req.context.models.dogs[id]);
});

// Update a dog by ID
router.put('/:dogId', (req, res) => {
  if (!req.context.models.dogs[req.params.dogId]) {
    return res.send(`No dog with ID ${req.params.dogId}`);
  }
  // Make a copy of the existing dog to modify
  const targetDog = req.context.models.dogs[req.params.dogId];
  // Manually going through potential update items, for now
  if (req.body.name) {
    targetDog.name = req.body.name;
  }
  if (req.body.color) {
    targetDog.color = req.body.color;
  }
  if (req.body.weight) {
    targetDog.weight = req.body.weight;
  }
  // Change the old dog to the updated one
  req.context.models.dogs[req.params.dogId] = targetDog;
  // Send updated dog back to confirm
  return res.send(req.context.models.dogs[req.params.dogId]);
});

// Delete a dog by ID
router.delete('/:dogId', (req, res) => {
  if (!req.context.models.dogs[req.params.dogId]) {
    return res.send(`No dog with ID ${req.params.dogId}`);
  }
  const { [req.params.dogId]: dog, ...otherDogs } = req.context.models.dogs;
  req.context.models.dogs = otherDogs;
  return res.send(dog);
});

export default router;
