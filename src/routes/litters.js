import Router from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get basic info on all litters
// As model grows, needs to be refined down to basic stats. Should probably eventually be eliminated altogether
router.get('/', async (req, res) => {
  const litters = await req.context.models.Litter.findAll();
  return res.send(litters);
});

export default router;
