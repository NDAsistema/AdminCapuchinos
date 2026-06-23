import { Router } from 'express';
import multer from 'multer';
import { SaintController } from '../controllers/SaintController';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const router = Router();

router.get('/', SaintController.findAll);
router.get('/:id', SaintController.findById);
router.post('/', upload.single('image'), SaintController.create);
router.put('/:id', upload.single('image'), SaintController.update);
router.delete('/:id', SaintController.delete);

export default router;
