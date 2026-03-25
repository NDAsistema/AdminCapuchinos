// src/routes/homeRoutes.ts
import { Router } from 'express';
import { HomeController } from '../controllers/HomeController';

const router = Router();

router.post('/', HomeController.create);
router.get('/', HomeController.getAll);
router.get('/:id', HomeController.getById);
router.put('/:id', HomeController.update);
router.delete('/:id', HomeController.delete);

// Rutas específicas
router.get('/getAllImgById/:id', HomeController.getAllImgById);
router.delete('/deleteImgHome/:id', HomeController.deleteImgHome);
router.post('/createImgHome', HomeController.createImgHome);

export default router;