import { Router } from 'express';
import { UserController } from "../controllers/UserController";

const router = Router();

router.get('/getAllUser', UserController.getAllUser);
router.get('/searchListTypeUsers', UserController.searchListTypeUsers); 
router.post('/create', UserController.create); 
router.put('/update/:id', UserController.update);

export default router;