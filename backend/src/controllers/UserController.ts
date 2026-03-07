import { Request, Response } from 'express';
import { uploadSingle } from '../middleware/uploadMiddleware'; // <-- ASEGÚRATE DE QUE ESTÉ ESTO
import AWSS3Service from '../services/awsS3Service';
import { UserModel } from '../models/UserModel';    


export class UserController {

    private static getUserId(req: Request): number {
        const user = (req as any).user;
        return user?.id || 1; 
    }

    static async getAllUser(req: Request, res: Response) {
        try {
            const users = await UserModel.getAllUser();
            return res.status(200).json(users);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            return res.status(500).json({ message: 'Error al obtener usuarios' });
        }
    }
}
