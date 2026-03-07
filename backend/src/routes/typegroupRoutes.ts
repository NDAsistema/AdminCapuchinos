import { Router } from 'express';
import { TypeGroupController } from '../controllers/typegroupController';

const router = Router();

// Ya no pongas /typegroup/ aquí
router.post('/create', TypeGroupController.create);
router.get('/getAll', TypeGroupController.getAll);
router.get('/getById/:id', TypeGroupController.getById);
router.put('/update/:id', TypeGroupController.update);
router.delete('/delete/:id', TypeGroupController.delete);

export default router;