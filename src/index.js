// This starts the server

import { sequelize } from './models';

import app from './server';

const PORT = process.env.PORT || 3300;

// Use Sequelize to connect to the database, and then listen on the port indicated in .env
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
