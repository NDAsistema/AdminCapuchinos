import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Login
router.post('/login', AuthController.login);

// Perfil del usuario (protegido)
router.get('/profile', authMiddleware, AuthController.getProfile);

export default router;