// Bring in the sequelize instance
import { sequelize } from '../src/database/models';

// Set up the test database
import testDatabaseSetup from './databaseSetup';

beforeEach(async () => {
  await testDatabaseSetup();
});

afterAll(() => sequelize.close());
