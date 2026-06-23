
import { Router } from 'express';
import multer from 'multer';
import { AttachmentController } from '../controllers/AttachmentController';

const router = Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } 
});

router.post('/upload-saint-image', upload.single('file'), AttachmentController.uploadFromEditorSaint);
router.post('/upload-newspaper-image', upload.single('file'), AttachmentController.uploadFromEditor);
router.post('/upload-task-image', upload.single('file'), AttachmentController.uploadFromEditorTask);

export default router;