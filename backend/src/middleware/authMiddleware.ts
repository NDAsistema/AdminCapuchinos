import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// EXPORTAMOS esta interfaz para que los controladores puedan usarla
export interface AuthRequest extends Request {
  user?: {
    id: number;
    id_brotther: number;
    email: string;
    name_brother: string;
    img_brother: string;
    type_user: number;
  };
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    try {
        const secret = process.env.JWT_SECRET || 'secret_key';
        const decoded = jwt.verify(token, secret) as any;

        req.user = {
            id: Number(decoded.id),
            id_brotther: Number(decoded.id_brotther),
            email: decoded.email,
            name_brother: decoded.name_brother,
            img_brother: decoded.img_brother,
            type_user: Number(decoded.type_user)
        };
        
        next();
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token inválido' });
    }
};