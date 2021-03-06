import Sequelize, { DataTypes } from 'sequelize';

// import models
import dog from './dog';
import breeder from './breeder';
import litter from './litter';
import image from './image';

// import config
import sequelizeConfig from '../config';

// Spin up our sequelize instance, with environment depending on Sequelize config
const env = process.env.NODE_ENV || 'dev';

const sequelize = new Sequelize(
  sequelizeConfig[env].database,
  sequelizeConfig[env].user,
  sequelizeConfig[env].password,
  {
    dialect: sequelizeConfig[env].dialect,
    logging: sequelizeConfig[env].logging,
  }
);

// Plug the models in to sequelize
const models = {
  Breeder: breeder(sequelize, DataTypes),
  Litter: litter(sequelize, DataTypes),
  Dog: dog(sequelize, DataTypes),
  Image: image(sequelize, DataTypes),
};

// Implement associations defined in the models:
Object.keys(models).forEach((key) => {
  if ('associate' in models[key]) {
    models[key].associate(models);
  }
});

export { sequelize };

export default models;
