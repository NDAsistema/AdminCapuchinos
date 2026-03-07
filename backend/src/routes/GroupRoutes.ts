import { Router } from 'express';
import { GroupController } from '../controllers/GroupController';

const router = Router();

router.post('/', GroupController.create);
router.post('/assignMembers', GroupController.assignMembersToGroup);
router.put('/:id', GroupController.update);
router.delete('/:id', GroupController.delete);
router.get('/', GroupController.getAll);
router.get('/:id', GroupController.getById);
router.get('/:id/getListBrotherAssing', GroupController.getListBrotherAssing);


router.get('/getAllImgById/:id', GroupController.getAllImgById);
router.post('/createImgGroup', GroupController.createImgGroup);
router.delete('/deleteImgGroup/:id', GroupController.deleteImgGroup);

export default router;