import models, { sequelize } from '../../src/database/models';

// Bring in data
import { breeders, superuser, dogs, litters } from './data';

const testDatabaseSetup = async () => {
  // Clear out the database, then populate it with pre-determined data
  try {
    await sequelize.sync({ force: true });
    await populateModel('Breeder', [...breeders, superuser]);
    await populateModel('Dog', dogs);
    await populateModel('Litter', litters);
  } catch (er) {
    console.log('Test database setup error:', er);
  }
};

const populateModel = async (modelName, data) => {
  for (const i of data) {
    await models[modelName].create(i);
  }
};

export default testDatabaseSetup;
