import Sequelize, { DataTypes } from 'sequelize';

// import models
import dog from './dog';
import breeder from './breeder';

// Spin up our sequelize instance
const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    dialect: 'postgres',
  }
);

// Plug the models in to sequelize. Order is important (I think), for associations between models to make sense
const models = {
  Breeder: breeder(sequelize, DataTypes),
  Dog: dog(sequelize, DataTypes),
};

// Implement associations defined in the models:
Object.keys(models).forEach((key) => {
  if ('associate' in models[key]) {
    models[key].associate(models);
  }
});

export { sequelize };

export default models;
