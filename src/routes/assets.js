import Router from 'express';

import controllers from '../controllers';

const router = Router();

// Default images should be publicly available
router.get('/defaultImages/:folder/:file', controllers.get.publicImage);

// Upload an image to a breeder's image folder. Requires auth.
router.post(
  '/upload/:breederId',
  controllers.auth.tokenExists,
  controllers.post.upload
);

export default router;
