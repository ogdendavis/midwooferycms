import Router from 'express';

const router = Router();

// import controllers from '../controllers';

router.post('/login', async (req, res, next) => {
  return res.send(req.body);
});

export default router;
