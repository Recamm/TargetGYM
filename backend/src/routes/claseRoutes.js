import { Router } from 'express';
import claseController from '../controllers/ClaseController.js';

const router = Router();

router.get('/', claseController.getAll);
router.get('/:id', claseController.getById);
router.post('/', claseController.create);
router.put('/:id', claseController.update);
router.delete('/:id', claseController.delete);

export default router;
