import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';

const router = Router();

router.get('/', TaskController.getAllTask);
router.get('/:id', TaskController.getTaskDetail);
router.post('/:id/submit-report', TaskController.submitReport);
router.patch('/reports/:id/review', TaskController.reviewReport);

router.post('/', TaskController.createTask);

// router.put('/:id', TaskController.updateTask);

// router.delete('/:id', TaskController.deleteTask);

export default router;