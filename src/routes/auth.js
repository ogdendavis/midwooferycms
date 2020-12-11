import Router from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// import controllers from '../controllers';

router.post('/login', async (req, res, next) => {
  // Find the breeder, early return if not found
  const breeder = await req.context.models.Breeder.findByPk(req.body.id);
  if (!breeder) {
    return res.status(404).send('No user found with those credentials');
  }
  // Check the password
  const correctPassword = breeder.passwordCheck(req.body.password);
  // Generate the token and return it, if successful
  if (correctPassword) {
    jwt.sign({ id: req.body.id }, 'secretkey', (err, token) => {
      if (err) {
        return res.status(500).send(err);
      } else {
        console.log(token);
        return res.send(token);
      }
    });
  } else {
    // If we get here, we have no errors, but the password check has failed
    return res.status(403).send('Failed Login');
  }
});

export default router;
