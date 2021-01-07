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

const uploadRandomBreederImage = async () => {
  // Uploads test image to random breeder's upload folder
  // Returns array with breeder object and image object
  const b = utils.randomBreeder();
  const bImageRes = await uploadImage(b.id);
  const bImage = bImageRes.body;
  return [b, bImage];
};

const uploadImage = (breederId) => {
  // Test image is in this folder as geekDog.jpg
  // Returns the res from the request
  return request(app)
    .post(`/assets/upload/${breederId}`)
    .set('Authorization', `Bearer: ${utils.getToken(breederId)}`)
    .attach('image', `${__dirname}/assets/geekDog.jpg`);
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

describe('GET image from breeder upload folder', () => {
  test('Success with valid credentials', async () => {
    const [{ id }, image] = await uploadRandomBreederImage();
    const res = await request(app)
      .get(`/assets/${image.id}`)
      .set('Authorization', `Bearer: ${utils.getToken(id)}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toEqual(image);
  });
});

describe('POST new image', () => {
  // Make sure to delete images created in these tests!
  afterAll(() => {
    utils.deleteTestBreederImages();
  });

  test('Uploads image to breeder folder', async () => {
    const { id } = utils.randomBreeder();
    const res = await uploadImage(id);
    // 201 to indicate asset creation
    expect(res.statusCode).toEqual(201);
    // image should exist in breeder folder on server
    expect(
      fs.existsSync(`${appPath.path}/assets/uploads/${id}/geekDog.jpg`)
    ).toEqual(true);
    // image should be saved in database
    const getRes = await request(app)
      .get(`/assets/${res.body.id}`)
      .set('Authorization', `Bearer: ${utils.getToken(id)}`);
    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body).toEqual(res.body);
  });
});

describe('DELETE existing image', () => {
  // All images created for these test should have been deleted, but just to be safe
  afterAll(() => {
    utils.deleteTestBreederImages();
  });

  test('Deletion removes image from server hard drive', async () => {
    const { id } = utils.randomBreeder();
    const uploadRes = await uploadImage(id);
    expect(uploadRes.statusCode).toEqual(201);
    // Now try to delete it!
    const res = await request(app)
      .delete(`/assets/${uploadRes.body.id}`)
      .set('Authorization', `Bearer: ${utils.getToken(id)}`);
    expect(res.statusCode).toEqual(200);
    // Response should contain same image object
    expect(res.body.id).toEqual(uploadRes.body.id);
    // File should no longer exist on hard drive
    expect(fs.existsSync(uploadRes.body.path)).toEqual(false);
  });
});
