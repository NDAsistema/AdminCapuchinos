import { Router } from 'express';
import { CalendarController } from '../controllers/CalendarController';

const router = Router();

router.get('/', CalendarController.list);
router.get('/:id', CalendarController.getById);
router.post('/', CalendarController.create);
router.put('/:id', CalendarController.update);
router.delete('/:id', CalendarController.remove);

export default router;
