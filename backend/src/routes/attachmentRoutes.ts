
import { Router } from 'express';
import multer from 'multer';
import { AttachmentController } from '../controllers/attachmentController';

const router = Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } 
});

router.post('/upload-newspaper-image', upload.single('file'), AttachmentController.uploadFromEditor);

export default router;