import request from 'supertest';
import fs from 'fs';

import app from '../src/server';

// Utils to bring in helpers and data from which database was created
import utils from './setup/utils';

import appPath from 'app-root-path';

const randomPublicAssetFilename = () => {
  const publicAssetFolder = `${appPath.path}/assets/defaultImages/dogs`;
  const options = fs.readdirSync(publicAssetFolder);
  return options[Math.floor(Math.random() * options.length)];
};

describe('GET public asset', () => {
  test('Retrieves public asset without auth', async () => {
    const testImageName = randomPublicAssetFilename();
    const res = await request(app).get(
      `/assets/defaultImages/dogs/${testImageName}`
    );
    // Test that it's a valid response with an image type
    expect(res.statusCode).toEqual(200);
    expect(res.header['content-type']).toEqual(
      expect.stringContaining('image')
    );
  });

  test('Retrieves public asset if auth is attached', async () => {
    // Same as above test, just making sure nothing goes funky with credentials attached
    const testImageName = randomPublicAssetFilename();
    const res = await request(app)
      .get(`/assets/defaultImages/dogs/${testImageName}`)
      .set(
        'Authorization',
        `Bearer: ${utils.getToken(utils.randomBreeder().id)}`
      );
    // Test that it's a valid response with an image type
    expect(res.statusCode).toEqual(200);
    expect(res.header['content-type']).toEqual(
      expect.stringContaining('image')
    );
  });
});

describe('POST new image', () => {
  // Make sure to delete images created in these tests!
  afterAll(() => {
    // Get all breeders
    const breeders = utils.allBreeders();
    // Iterate over the list of breeders
    breeders.forEach((b) => {
      const folderPath = `${appPath.path}/assets/uploads/${b.id}`;
      // Check if upload folder exists for breeder
      if (fs.existsSync(folderPath)) {
        // If it does, kill it!
        fs.rmdirSync(folderPath, { recursive: true });
      }
    });
  });

  // Test image is in this folder as geekDog.jpg
  test('Uploads image to breeder folder', async () => {
    const testBreeder = utils.randomBreeder();
    const res = await request(app)
      .post(`/assets/upload/${testBreeder.id}`)
      .set('Authorization', `Bearer: ${utils.getToken(testBreeder.id)}`)
      .attach('image', `${__dirname}/geekDog.jpg`);
    // 201 to indicate asset creation
    expect(res.statusCode).toEqual(201);
    // image should exist in breeder folder on server
    expect(
      fs.existsSync(
        `${appPath.path}/assets/uploads/${testBreeder.id}/geekDog.jpg`
      )
    ).toEqual(true);
  });
});
