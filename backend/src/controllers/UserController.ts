import { Request, Response } from 'express';
import { uploadSingle } from '../middleware/uploadMiddleware'; // <-- ASEGÚRATE DE QUE ESTÉ ESTO
import AWSS3Service from '../services/awsS3Service';
import { UserModel } from '../models/UserModel';    
import { TypeUserModel } from '../models/TypeUserModel';


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

    static async create(req: Request, res: Response) {
        try {
            const { email, password, type_user, id_brother } = req.body;
            const created_by = UserController.getUserId(req);
            if (!email || !password) {
                return res.status(400).json({ message: 'Email y contraseña son requeridos' });
            }
            const newUser = await UserModel.create({
                email,
                password,
                type_user,
                id_brother,
                created_by 
            });

            return res.status(201).json({ success: true, data: newUser });
        } catch (error: any) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ message: 'Este correo ya está registrado' });
            }
            return res.status(500).json({ message: 'Error al crear usuario' });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { type_user, password } = req.body;
            if (!id) return res.status(400).json({ message: 'ID de usuario requerido' });
            const updatedUser = await UserModel.update(Number(id), {
                type_user,
                password
            });
            return res.status(200).json({ 
                success: true, 
                data: updatedUser 
            });
        } catch (error) {
            console.error('Error al actualizar:', error);
            return res.status(500).json({ message: 'Error interno al actualizar usuario' });
        }
    }

    static async searchListTypeUsers(req: Request, res: Response) {
        try {
            const users = await TypeUserModel.findAll();
            return res.status(200).json(users);
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            return res.status(500).json({ message: 'Error al obtener usuarios' });
        }
    }

}
