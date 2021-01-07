import Router from 'express';

import controllers from '../controllers';

const router = Router();

// Default images should be publicly available
router.get('/defaultImages/:folder/:file', controllers.get.publicImage);

// Get an image by id
router.get('/:imageId', controllers.auth.checkToken, controllers.get.byId);

// Upload an image to a breeder's image folder. Requires auth.
router.post(
  '/upload/:breederId',
  controllers.auth.tokenExists,
  controllers.post.uploadImage
);

// Delete an image from breeder's uploads folder. Requires auth.
router.delete(
  '/:imageId',
  controllers.auth.checkToken,
  controllers.del.deleteOne
);

export default router;
