import Router from 'express';

// Get project root for setting filepath
import appPath from 'app-root-path';

const router = Router();

// Default images should be publicly available
router.get('/defaultImages/:folder/:file', (req, res, next) => {
  // Set route root!
  const options = {
    root: appPath.path,
  };
  // Get the file, with root and error handler
  res.sendFile(
    `/assets/defaultImages/${req.params.folder}/${req.params.file}`,
    options,
    (err) => {
      if (err) {
        next(err);
      }
    }
  );
});

export default router;
