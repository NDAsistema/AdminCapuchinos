import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Login
router.post('/login', AuthController.login);

// Perfil del usuario (protegido)
router.get('/profile', authMiddleware, AuthController.getProfile);
router.put('/profile', authMiddleware, AuthController.updateProfile);
router.put('/change-password', authMiddleware, AuthController.changePassword);

export default router;
