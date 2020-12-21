/*
 * ONLY use this to initially set up a database
 * It will dump the existing database and overwrite it with the data in data.js
 */

import models, { sequelize } from '../models';

import { superuser, breeder, litter, dogs } from './data';

const databaseSetup = async () => {
  try {
    await sequelize.sync({ force: true });
    await populateModel('Breeder', [superuser, breeder]);
    await populateModel('Dog', dogs);
    await populateModel('Litter', litter);
    return { superuser, breeder };
  } catch (er) {
    console.error('Database setup error: ', er);
    return;
  }
};

const populateModel = async (modelName, data) => {
  // If a list of things is passed in, make each thing
  if (Array.isArray(data)) {
    for (const i of data) {
      await models[modelName].create(i);
    }
  }
  // If one thing is passed in, make it!
  else {
    await models[modelName].create(data);
  }
};

export default databaseSetup;
