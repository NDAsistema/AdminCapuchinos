import { Router } from 'express';
import { UserController } from "../controllers/UserController";

const router = Router();

router.get('/getAllUser', UserController.getAllUser);


export default router;