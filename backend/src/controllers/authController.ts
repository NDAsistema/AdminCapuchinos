import { Request, Response } from 'express';
import { UserModel } from '../models/UserModel';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export class AuthController {
  
  // MÉTODO: LOGIN
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

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

      // Comparación segura con Bcrypt
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Generar Token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          id_brother: user.id_brother, 
          email: user.email, 
          name_brother: user.name_brother,
          img_brother: user.img_brother,
          type_user: user.type_user 
        },
        process.env.JWT_SECRET || 'secret_key',
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        user: {
          id: user.id,
          id_brother: user.id_brother,
          email: user.email,
          type_user: user.type_user,
          name_brother: user.name_brother,
          img_brother: user.img_brother,
          status: user.status
        },
        token,
        message: 'Login exitoso'
      });

    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // MÉTODO: GET PROFILE (Restaurado y Corregido)
  static async getProfile(req: Request, res: Response) {
    try {
      // El middleware de auth agrega el usuario al request como 'user'
      const user = (req as any).user;

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado en la sesión'
        });
      }
      
      return res.json({
        success: true,
        user: {
          id: user.id,
          id_brother: user.id_brother, // Validar que el middleware use este nombre
          email: user.email,
          name_brother: user.name_brother,
          img_brother: user.img_brother,
          type_user: user.type_user,
          status: user.status
        }
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}