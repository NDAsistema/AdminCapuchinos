import { pool } from '../config/database';
import bcrypt from 'bcrypt';

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
      const { type_user, password } = userData;
      let query: string;
      let params: any[];

      // Verificamos que el password sea un string real y no esté vacío
      if (password && typeof password === 'string' && password.trim() !== "") {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          
          query = 'UPDATE users SET type_user = ?, password = ?, updated_at = NOW() WHERE id = ?';
          params = [type_user, hashedPassword, id];
      } else {
          // Si no hay password nuevo, solo actualizamos el rol para no romper el login
          query = 'UPDATE users SET type_user = ?, updated_at = NOW() WHERE id = ?';
          params = [type_user, id];
      }

      try {
          await pool.execute(query, params);
          return { id, type_user };
      } catch (error) {
          console.error('Error en el modelo al actualizar:', error);
          throw error;
      }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT u.*, b.name as name_brother, b.img as img_brother FROM users as u LEFT JOIN brothers as b on (b.id = u.id_brother) WHERE u.email = ? AND u.status = 1',
        [email]
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
        'SELECT id, id_brother, type_user, status, email, created_at FROM users WHERE id = ?',
        [id]
      );
      
      const users = rows as User[];
      return users.length > 0 ? users[0] : null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
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
        'SELECT u.id, u.type_user, u.email, u.password, b.name as name_brother, b.img, tu.name as typ_name FROM users u LEFT JOIN brothers b ON (b.id = u.id_brother) LEFT JOIN type_users tu on (tu.id = u.type_user) WHERE u.status = 1 AND b.status = 1 ORDER BY b.name'
      );
      return rows as User[];
    } catch (error) {
      console.error('Error finding users by type:', error);
      throw error;
    } 
  }

}