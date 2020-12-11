import jwt from 'jsonwebtoken';

const auth = {
  login: async (req, res, next) => {
    // Find the breeder, early return if not found
    const breeder = await req.context.models.Breeder.findOne({
      where: { email: req.body.email },
    }).catch(next);
    if (!breeder) {
      return res.status(404).send('No user found with those credentials');
    }
    // Check the password
    const correctPassword = breeder.passwordCheck(req.body.password);
    // Generate the token and return it, if successful
    if (correctPassword) {
      jwt.sign({ id: req.body.id }, process.env.JWT_KEY, (err, token) => {
        if (err) {
          return res.status(500).send(err);
        } else {
          return res.send(token);
        }
      });
    } else {
      return res.status(401).send('Failed Login');
    }
  },

  checkToken: async (req, res, next) => {
    const { authorization } = req.headers;
    const token = authorization && authorization.split(' ')[1];
    if (!token) {
      return res.status(401).send('Missing token');
    }
    jwt.verify(token, process.env.JWT_KEY, (err, user) => {
      if (err) {
        return res.status(500).send(err);
      } else {
        req.user = user;
        next();
      }
    });
  },
};

export default auth;
