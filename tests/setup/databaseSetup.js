import models, { sequelize } from '../../src/database/models';

// Bring in data
import { breeders, dogs } from './data';

const testDatabaseSetup = async () => {
  // Clear out the database, then populate it with pre-determined data
  try {
    await sequelize.sync({ force: true });
    await createBreeders(breeders);
    await createDogs(dogs);
  } catch (er) {
    console.log('not connected', er);
  }
};

const createBreeders = async (ba) => {
  for (const b of ba) {
    await models.Breeder.create(b);
  }
};

const createDogs = async (da) => {
  for (const d of da) {
    await models.Dog.create(d);
  }
};

export default testDatabaseSetup;
