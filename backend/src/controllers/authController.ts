import { Request, Response } from 'express';
import { UserModel } from '../models/UserModel';
  
import jwt from 'jsonwebtoken';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validaciones básicas
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y password son requeridos'
        });
      }

      // Buscar usuario por email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      if (password !== user.password) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }


      const token = jwt.sign(
        { 
          id: user.id, 
          id_brotther: user.id_brother, 
          email: user.email, 
          name_brother: user.name_brother,
          img_brother:  user.img_brother,
          type_user: user.type_user 
        },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        user: {
          id: user.id,
          id_brother: user.id_brother,
          email: user.email,
          type_user: user.type_user,
          name_brother: user.name_brother,
          img_brother:  user.img_brother,
          status: user.status
        },
        token,
        message: 'Login exitoso'
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      // El middleware de auth agregará el usuario al request
      const user = (req as any).user;
      
      res.json({
        success: true,
        user: {
          id: user.id,
          id_brother: user.id_brother,
          email: user.email,
          type_user: user.type_user,
          status: user.status
        }
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}