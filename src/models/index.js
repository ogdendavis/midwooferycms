import Sequelize, { DataTypes } from 'sequelize';

// import models
import dog from './dog';
import breeder from './breeder';

const sequelize = new Sequelize(
  process.env.DATABASE,
  process.env.DATABASE_USER,
  process.env.DATABASE_PASSWORD,
  {
    dialect: 'postgres',
  }
);

const models = {
  Dog: dog(sequelize, DataTypes),
  Breeder: breeder(sequelize, DataTypes),
};

export { sequelize };

export default models;
