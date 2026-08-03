import { pool } from '../config/database';
import bcrypt from 'bcrypt';

/** Evita hashear de nuevo un valor que ya es hash bcrypt */
function isBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}

export interface User {
  id: number;
  id_brother: number | null;
  type_user: number; // 1=admin, 2=usuario, 3=comunicaciones
  status: number;
  email: string;
  password: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  name_brother: string;
  img_brother: string;
  study?: string;
  cv?: string;
  birth_date?: string | null;
  year_profession?: string | null;
  brother_email?: string;
}

export class UserModel {

  static async create(userData: any) {
    const { email, password, type_user, id_brother, created_by } = userData;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    try {
      const [result] = await pool.execute(
        'INSERT INTO users (email, password, type_user, id_brother, status, created_by, created_at) VALUES (?, ?, ?, ?, 1, ?, NOW())',
        [email, hashedPassword, type_user, id_brother, created_by]
      );
      
      const insertId = (result as any).insertId;
      return { id: insertId, email, type_user, id_brother };
    } catch (error) {
      console.error('Error en UserModel.create:', error);
      throw error;
    }
  }

  static async update(id: number, userData: any) {
      const type_user = Number(userData.type_user);
      const rawPassword =
          typeof userData.password === 'string' ? userData.password.trim() : '';

      if (!Number.isFinite(type_user) || type_user < 1) {
          throw new Error('Tipo de usuario inválido');
      }

      let query: string;
      let params: any[];
      let passwordUpdated = false;

      if (rawPassword !== '') {
          if (isBcryptHash(rawPassword)) {
              throw new Error('La contraseña no puede ser un hash; ingrese texto plano');
          }
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(rawPassword, salt);

          if (hashedPassword.length < 60) {
              throw new Error('Error al generar hash de contraseña');
          }

          query = 'UPDATE users SET type_user = ?, password = ?, updated_at = NOW() WHERE id = ? AND status = 1';
          params = [type_user, hashedPassword, id];
          passwordUpdated = true;
      } else {
          query = 'UPDATE users SET type_user = ?, updated_at = NOW() WHERE id = ? AND status = 1';
          params = [type_user, id];
      }

      try {
          const [result] = await pool.execute(query, params);
          const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;

          if (affectedRows === 0) {
              throw new Error('Usuario no encontrado o inactivo');
          }

          return { id, type_user, passwordUpdated };
      } catch (error) {
          console.error('Error en el modelo al actualizar:', error);
          throw error;
      }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT u.*, b.name as name_brother, b.img as img_brother FROM users as u LEFT JOIN brothers as b on (b.id = u.id_brother) WHERE LOWER(TRIM(u.email)) = ? AND u.status = 1',
        [email.trim().toLowerCase()]
      );
      
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findById(id: number): Promise<User | null> {
    try {
      const [rows] = await pool.execute(
        `SELECT u.id, u.id_brother, u.type_user, u.status, u.email, u.password, u.created_at,
                b.name as name_brother, b.img as img_brother,
                b.study, b.cv, b.birth_date, b.year_profession, b.email as brother_email
         FROM users u
         LEFT JOIN brothers b ON b.id = u.id_brother
         WHERE u.id = ? AND u.status = 1`,
        [id]
      );
      
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  }

  static async updateEmail(id: number, email: string): Promise<void> {
    const [result] = await pool.execute(
      'UPDATE users SET email = ?, updated_at = NOW() WHERE id = ? AND status = 1',
      [email.trim().toLowerCase(), id]
    );
    const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
    if (affectedRows === 0) {
      throw new Error('Usuario no encontrado o inactivo');
    }
  }

  static async updatePassword(id: number, hashedPassword: string): Promise<void> {
    const [result] = await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ? AND status = 1',
      [hashedPassword, id]
    );
    const affectedRows = (result as { affectedRows?: number }).affectedRows ?? 0;
    if (affectedRows === 0) {
      throw new Error('Usuario no encontrado o inactivo');
    }
  }

  static async emailExistsForOtherUser(email: string, excludeUserId: number): Promise<boolean> {
    const [rows] = await pool.execute(
      'SELECT id FROM users WHERE LOWER(TRIM(email)) = ? AND id != ? AND status = 1 LIMIT 1',
      [email.trim().toLowerCase(), excludeUserId]
    );
    return (rows as any[]).length > 0;
  }

  static async findListUsersType(type_user: number): Promise<User[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT b.id as id, b.name as name FROM users u LEFT JOIN brothers b on (b.id = u.id_brother) where b.status = 1 and u.type_user = ?',
        [type_user]
      );
      return rows as User[];
    } catch (error) {
      console.error('Error finding users by type:', error);
      throw error;
    }   
  }

  /** Listado de usuario  */
  static async getAllUser()
  {
    try {
      const [rows] = await pool.execute(
        'SELECT u.id, u.type_user, u.email, b.name as name_brother, b.img, tu.name as typ_name FROM users u LEFT JOIN brothers b ON (b.id = u.id_brother) LEFT JOIN type_users tu on (tu.id = u.type_user) WHERE u.status = 1 AND b.status = 1 ORDER BY b.name'
      );
      return rows as User[];
    } catch (error) {
      console.error('Error finding users by type:', error);
      throw error;
    } 
  }

}