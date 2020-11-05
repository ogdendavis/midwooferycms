import models, { sequelize } from '../src/database/models';

const testDatabaseSetup = async () => {
  // Clear out the database, then populate it with pre-determined data
  try {
    await sequelize.sync({ force: true }).then(async () => {
      await createBreeders();
      await createDogs();
    });
  } catch (er) {
    console.log('not connected', er);
  }
};

const createBreeders = async () => {
  await models.Breeder.create({
    id: 'b1',
    firstname: 'Fred',
    lastname: 'Astaire',
    city: 'Marshall',
    state: 'TX',
  });
  await models.Breeder.create({
    id: 'b2',
    firstname: 'Ginger',
    lastname: 'Rogers',
    city: 'Kingston',
    state: 'RI',
  });
};

const createDogs = async () => {
  await models.Dog.create({
    id: 'd1',
    name: 'Gypsy',
    breed: 'labrador retriever',
    color: 'black',
    weight: '60',
    breederId: 'b1',
  });
  await models.Dog.create({
    id: 'd2',
    name: 'Freyja',
    breed: 'doxie-poo',
    color: 'merle',
    weight: '14',
    breederId: 'b2',
  });
  await models.Dog.create({
    id: 'd3',
    name: 'Sylive',
    breed: 'cat',
    color: 'stabby',
    weight: '8',
    breederId: 'b2',
  });
  await models.Dog.create({
    id: 'd4',
    name: 'Figgy',
    breed: 'goldendoodle',
    color: 'parti',
    weight: '23',
    breederId: 'b2',
  });
  await models.Dog.create({
    id: 'd5',
    name: 'Cedric',
    breed: 'goldendoodle',
    color: 'apricot',
    weight: '29',
    breederId: 'b1',
  });
};

export default testDatabaseSetup;
