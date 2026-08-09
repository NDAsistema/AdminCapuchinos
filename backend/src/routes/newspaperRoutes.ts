import { Router } from 'express';
import { NewspaperController } from '../controllers/NewspaperController';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.get('/listAllNewspaper', NewspaperController.findAll);
router.get('/slug/:slug', NewspaperController.findBySlug);
router.post('/createNews', upload.single('image'), NewspaperController.create);
router.put('/updateNews/:id', upload.single('image'), NewspaperController.update);

export default router;
