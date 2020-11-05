// Bring in the sequelize instance
import { sequelize } from '../src/database/models';

// Set up the test database
import testDatabaseSetup from './databaseSetup';

beforeAll(async () => {
  await testDatabaseSetup();
});

afterAll(() => sequelize.close());
