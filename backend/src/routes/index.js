import { Router } from 'express';
import claseRoutes from './claseRoutes.js';

const router = Router();

router.use('/clases', claseRoutes);

export default router;
