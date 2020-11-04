import { sequelize } from '../src/models';

afterAll(() => sequelize.close());
