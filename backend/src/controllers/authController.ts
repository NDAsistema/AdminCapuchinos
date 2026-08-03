import { Request, Response } from 'express';
import { UserModel } from '../models/UserModel';
import { BrotherModel } from '../models/BrotherModel';
import { TaskModel } from '../models/TaskModel';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { uploadSingle } from '../middleware/uploadMiddleware';
import AWSS3Service from '../services/awsS3Service';
import { AuthRequest } from '../middleware/authMiddleware';

export class AuthController {


  static getUserId(req: Request): number {
    const user = (req as any).user;
    return user?.id || 1; 
  }

  private static formatProfileUser(user: any, isGroupLeader: boolean) {
    return {
      id: user.id,
      id_brother: user.id_brother,
      email: user.email,
      name_brother: user.name_brother || null,
      img_brother: user.img_brother || null,
      type_user: user.type_user,
      status: user.status,
      study: user.study || '',
      cv: user.cv || '',
      birth_date: user.birth_date || null,
      year_profession: user.year_profession || null,
      is_group_leader: isGroupLeader,
    };
  }
  
  // MÉTODO: LOGIN
  static async login(req: Request, res: Response) {
    try {
      const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const password = typeof req.body.password === 'string' ? req.body.password : '';

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y password son requeridos'
        });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      const storedPassword = user.password?.trim() || '';
      if (!storedPassword.startsWith('$2')) {
        console.error(`Usuario ${user.id}: contraseña en BD no está hasheada con bcrypt`);
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
        });
      }

      const isMatch = await bcrypt.compare(password, storedPassword);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      const isGroupLeader =
        Number(user.type_user) === 2 && user.id_brother
          ? await TaskModel.isGroupLeader(Number(user.id_brother))
          : false;

      // Generar Token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          id_brother: user.id_brother, 
          email: user.email, 
          name_brother: user.name_brother,
          img_brother: user.img_brother,
          type_user: user.type_user,
          is_group_leader: isGroupLeader,
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
          status: user.status,
          is_group_leader: isGroupLeader,
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

  // MÉTODO: GET PROFILE
  static async getProfile(req: Request, res: Response) {
    try {
      const sessionUser = (req as any).user;

      if (!sessionUser?.id) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado en la sesión'
        });
      }

      const user = await UserModel.findById(Number(sessionUser.id));
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      const isGroupLeader =
        Number(user.type_user) === 2 && user.id_brother
          ? await TaskModel.isGroupLeader(Number(user.id_brother))
          : false;

      return res.json({
        success: true,
        user: AuthController.formatProfileUser(user, isGroupLeader)
      });
    } catch (error) {
      console.error('Error getting profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /** Actualizar datos personales y/o foto del propio perfil */
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      uploadSingle(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message || 'Error al subir la imagen'
          });
        }

        try {
          const sessionUser = req.user;
          if (!sessionUser?.id) {
            return res.status(401).json({
              success: false,
              message: 'No autenticado'
            });
          }

          const user = await UserModel.findById(Number(sessionUser.id));
          if (!user) {
            return res.status(404).json({
              success: false,
              message: 'Usuario no encontrado'
            });
          }

          if (!user.id_brother) {
            return res.status(400).json({
              success: false,
              message: 'El usuario no tiene un perfil de hermano asociado'
            });
          }

          const brother = await BrotherModel.findById(Number(user.id_brother));
          if (!brother) {
            return res.status(404).json({
              success: false,
              message: 'Perfil de hermano no encontrado'
            });
          }

          const name =
            typeof req.body.name === 'string' && req.body.name.trim()
              ? req.body.name.trim()
              : brother.name;
          const email =
            typeof req.body.email === 'string' && req.body.email.trim()
              ? req.body.email.trim().toLowerCase()
              : (brother.email || user.email);
          const study =
            req.body.study !== undefined ? String(req.body.study) : brother.study;
          const cv = req.body.cv !== undefined ? String(req.body.cv) : brother.cv;
          const birth_date =
            req.body.birth_date !== undefined ? req.body.birth_date || null : brother.birth_date;
          const year_profession =
            req.body.year_profession !== undefined
              ? req.body.year_profession || null
              : brother.year_profession;

          if (!name || !email) {
            return res.status(400).json({
              success: false,
              message: 'Nombre y email son requeridos'
            });
          }

          if (email !== user.email) {
            const emailTaken = await UserModel.emailExistsForOtherUser(email, user.id);
            if (emailTaken) {
              return res.status(409).json({
                success: false,
                message: 'El email ya está registrado por otro usuario'
              });
            }
          }

          if (email !== brother.email) {
            const brotherWithEmail = await BrotherModel.findByEmail(email);
            if (brotherWithEmail && brotherWithEmail.id !== brother.id) {
              return res.status(409).json({
                success: false,
                message: 'El email ya está registrado por otro hermano'
              });
            }
          }

          const updateData: any = {
            name,
            email,
            study,
            cv,
            birth_date,
            year_profession,
          };

          if (req.file) {
            if (brother.img) {
              try {
                await AWSS3Service.deleteImage(brother.img);
              } catch (deleteError) {
                console.error('Error eliminando imagen anterior de S3:', deleteError);
              }
            }
            updateData.img = await AWSS3Service.uploadImage(req.file);
          }

          await BrotherModel.update(brother.id, updateData);

          if (email !== user.email) {
            await UserModel.updateEmail(user.id, email);
          }

          const refreshed = await UserModel.findById(user.id);
          const isGroupLeader =
            Number(refreshed!.type_user) === 2 && refreshed!.id_brother
              ? await TaskModel.isGroupLeader(Number(refreshed!.id_brother))
              : false;

          return res.json({
            success: true,
            message: 'Perfil actualizado correctamente',
            user: AuthController.formatProfileUser(refreshed, isGroupLeader),
          });
        } catch (innerError) {
          console.error('Error updating profile:', innerError);
          return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
          });
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  /** Cambiar contraseña del propio usuario */
  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const sessionUser = req.user;
      if (!sessionUser?.id) {
        return res.status(401).json({
          success: false,
          message: 'No autenticado'
        });
      }

      const currentPassword =
        typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
      const newPassword =
        typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
      const confirmPassword =
        typeof req.body.confirmPassword === 'string' ? req.body.confirmPassword : '';

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos de contraseña son requeridos'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'La confirmación de contraseña no coincide'
        });
      }

      const user = await UserModel.findById(Number(sessionUser.id));
      if (!user || !user.password) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password.trim());
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await UserModel.updatePassword(user.id, hashedPassword);

      return res.json({
        success: true,
        message: 'Contraseña actualizada correctamente'
      });
    } catch (error) {
      console.error('Error changing password:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}
