// Continue from https://www.robinwieruch.de/node-express-server-rest-api#modular-models-in-express-as-data-sources

/* NPM imports */

// Express to manage the API
import express from 'express';
// Express middleware
import bodyParser from 'body-parser';
import cors from 'cors';
// To generate unique IDs for dogs
import { v4 as uuidv4 } from 'uuid';

/* Local imports */

import models from './models';
console.log(models);
/* And now the app! */

// Spin up Express app
const app = express();

// Middleware config
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Bring in local data
app.use((req, res, next) => {
  req.context = {
    models,
  };
  next();
});

// We'll listen on localhost:3000
const port = 3000;

/* Operations for the /dogs route */

// Get all dogs
app.get('/dogs', (req, res) => {
  return res.send(Object.values(req.context.models.dogs));
});

// Get one dog by id
app.get('/dogs/:dogId', (req, res) => {
  const dog = req.context.models.dogs[req.params.dogId];
  if (dog) {
    return res.send(dog);
  }
  return res.send(`No dog with ID ${req.params.dogId}`);
});

// Create a dog
app.post('/dogs', (req, res) => {
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
app.put('/dogs/:dogId', (req, res) => {
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
app.delete('/dogs/:dogId', (req, res) => {
  if (!req.context.models.dogs[req.params.dogId]) {
    return res.send(`No dog with ID ${req.params.dogId}`);
  }
  const { [req.params.dogId]: dog, ...otherDogs } = req.context.models.dogs;
  req.context.models.dogs = otherDogs;
  return res.send(dog);
});

// Make it go!
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
