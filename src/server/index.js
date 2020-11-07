// This defines the server

// Express to manage the API
import express from 'express';
// Express middleware
import bodyParser from 'body-parser';
import cors from 'cors';

// Local imports
import models from '../database/models';
import routes from '../routes';

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

// Export for implementation in src/index, as well as testing
export default app;