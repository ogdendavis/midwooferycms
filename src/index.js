// This starts the server

import { sequelize } from './database/models';

import app from './server';

const PORT =
  process.env.NODE_ENV === 'dev'
    ? process.env.DEV_PORT
    : process.env.NODE_ENV === 'test'
    ? process.env.TEST_PORT
    : process.env.NODE_ENV === 'prod'
    ? process.env.PROD_PORT
    : 3300;

// Use Sequelize to connect to the database, and then listen on the port indicated in .env
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(
      `Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
    );
  });
});
