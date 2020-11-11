// Bring in the sequelize instance
import { sequelize } from '../../src/database/models';

// Set up the test database
import testDatabaseSetup from './databaseSetup';

// Add utility to match null or anything -- like expect.anything, but expanded to include null for matching deletedAt field created by soft delete (paranoid: true) in models
expect.extend({
  notUndefined(received) {
    const passes = received === undefined ? false : true;
    return {
      pass: passes,
      message: () => `expected null or a value, received undefined`,
    };
  },
});

beforeEach(async () => {
  await testDatabaseSetup();
});

afterAll(() => sequelize.close());
