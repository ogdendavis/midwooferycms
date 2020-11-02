/* NPM imports */

// Express to manage the API
import express from 'express';
// Express middleware
import bodyParser from 'body-parser';
import cors from 'cors';
// To generate unique IDs for dogs
import { v4 as uuidv4 } from 'uuid';

/* Local imports */

import models, { sequelize } from './models';
import routes from './routes';

/* And now the app! */

// Spin up Express app
const app = express();

// Middleware config
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Bring in local data by adding it as context in middleware step
app.use((req, res, next) => {
  req.context = {
    models,
  };
  next();
});

// Bring in routes
app.use('/breeders', routes.breeders);
app.use('/dogs', routes.dogs);

// If on dev, we'll re-seed the server every time we restart
const eraseDatabaseOnSync = process.env.NODE_ENV === 'dev' ? true : false;

// Use Sequelize to connect to the database, and then listen on the port indicated in .env
sequelize.sync({ force: eraseDatabaseOnSync }).then(() => {
  if (eraseDatabaseOnSync) {
    createDogAndBreeder();
  }
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
});

// Helper function to seed the server when starting in dev mode
const createDogAndBreeder = async () => {
  const figId = uuidv4();
  const cedId = uuidv4();
  const breederId = uuidv4();

  await models.Breeder.create({
    id: breederId,
    firstname: 'Ji',
    lastname: 'Khalsa',
    city: 'Gainesville',
    state: 'FL',
  });

  await models.Dog.create({
    id: figId,
    breed: 'goldendoodle',
    color: 'parti',
    name: 'Figgy',
    weight: '23',
    breederId,
  });
  await models.Dog.create({
    id: cedId,
    breed: 'goldendoodle',
    color: 'apricot',
    name: 'Cedric',
    weight: '29',
    breederId,
  });
};
