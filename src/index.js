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
import routes from './routes';

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

// Bring in routes
app.use('/dogs', routes.dogs);

// We'll listen on localhost:3000
const port = 3000;

// Make it go!
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
