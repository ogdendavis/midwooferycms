import Router from 'express';

const router = Router();

// import controllers from '../controllers';

router.post('/login', async (req, res, next) => {
  const breeder = await req.context.models.Breeder.findByPk(req.body.id);
  const correctPassword = breeder.passwordCheck(req.body.password);
  const [status, message] = correctPassword
    ? [200, 'Successful Login']
    : [403, 'Failed Login'];
  return res.status(status).send(message);
});

export default router;
