import { Router } from 'express';
import { NewspaperController } from '../controllers/NewspaperController';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

// IMPORTANTE: Al ser métodos estáticos, se llaman directamente desde la Clase
router.get('/listAllNewspaper', NewspaperController.findAll);
router.post('/createNews', upload.single('image'), NewspaperController.create);
router.put('/updateNews/:id', upload.single('image'), NewspaperController.update);  
router.delete('/deleteNews/:id', NewspaperController.delete);

export default router;