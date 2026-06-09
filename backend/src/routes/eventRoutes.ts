import { Router } from 'express';
import { EventController } from '../controllers/EventController';

const router = Router();

router.get('/', EventController.list);
router.get('/:id', EventController.getById);
router.post('/', EventController.create);
router.put('/:id', EventController.update);
router.delete('/:id', EventController.remove);
router.post('/:id/exceptions', EventController.createException);
router.delete('/:id/exceptions/:exceptionId', EventController.removeException);

export default router;
