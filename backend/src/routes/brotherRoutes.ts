// src/routes/brotherRoutes.ts - MODIFICADO IGUAL QUE homeRoutes.ts
import { Router } from 'express';
import { BrotherController } from '../controllers/brotherController';

const router = Router();

// TODAS las rutas igual que en homeRoutes - SIN middleware aquí
router.get('/searchListBrotherByCreateUsers', BrotherController.searchListBrotherByCreateUsers);
router.get('/findBrothersForGuardian', BrotherController.findBrothersForGuardian);
router.get('/findBrothersForParishPriest', BrotherController.findBrothersForParishPriest);
router.get('/findBrothersForCommunicationUser', BrotherController.findBrothersForCommunicationUser);
router.get('/getListTypeUserServices', BrotherController.getListTypeUserServices);
router.get('/', BrotherController.getAll);                     // Obtener todos los hermanos
router.post('/', BrotherController.create);                    // Crear hermano

router.get('/:id', BrotherController.getById);                 // Obtener por ID
router.put('/:id', BrotherController.update);                  // Actualizar
router.delete('/:id', BrotherController.delete);               // Eliminar

export default router;