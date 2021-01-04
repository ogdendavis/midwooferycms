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
app.use('/litters', routes.litters);
app.use('/auth', routes.auth);

// Handle non-existent routes
app.get('*', (req, res, next) => {
  return res.status(404).send({ error: 'No such route' });
});

// Handle errors -- 4 args tells Express this is an error handler
app.use((err, req, res, next) => {
  let [status, message] = [500, ''];
  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const msgArr = [];
    for (const e of err.errors) {
      msgArr.push(e.message);
    }
    message = msgArr.join('. ');
    status = 400;
    return res.status(status).send(message);
  }
  // Console log unhandled errors;
  if (message === '') {
    console.error('Unhandled database error', err);
  }
  return res.status(status).send(message);
});

// Export for implementation in src/index, as well as testing
export default app;
