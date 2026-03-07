// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// DECLARACIÓN INMEDIATA - Colócala AL INICIO del archivo
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        id_brotther: number;
        email: string;
        name_brother : string;
        img_brother: string;
        type_user: string;
      };
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Acceso denegado. Token no proporcionado.'
        });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key') as any;
        req.user = {
            id: decoded.id,
            id_brotther: decoded.id_brotther,
            email: decoded.email,
            name_brother: decoded.name_brother,
            img_brother: decoded.img_brother,
            type_user: decoded.type_user
        };
        
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};