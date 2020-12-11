import Router from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

import controllers from '../controllers';

router.post('/login', controllers.auth.login);

export default router;
