const sequelizeConfig = {
  dev: {
    database: process.env.DEV_DATABASE,
    user: process.env.DEV_USER,
    password: process.env.DEV_PASSWORD,
    dialect: 'postgres',
    logging: false,
  },
  test: {
    database: process.env.TEST_DATABASE,
    user: process.env.TEST_USER,
    password: process.env.TEST_PASSWORD,
    dialect: 'postgres',
    logging: false,
  },
  prod: {
    database: process.env.PROD_DATABASE,
    user: process.env.PROD_USER,
    password: process.env.PROD_PASSWORD,
    dialect: 'postgres',
    logging: false,
  },
};

export default sequelizeConfig;
