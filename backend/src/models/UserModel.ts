import { pool } from '../config/database';

export interface User {
  id: number;
  id_brother: number | null;
  type_user: number; // 1=admin, 2=usuario, 3=comunicaciones
  status: number;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
  name_brother: string;
  img_brother: string;
}

export class UserModel {
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
        'SELECT u.id, u.type_user, u.email, u.password, b.name, b.img, tu.name FROM users u LEFT JOIN brothers b ON (b.id = u.id_brother) LEFT JOIN type_users tu on (tu.id = u.type_user) WHERE u.status = 1 AND b.status = 1 ORDER BY b.name'
      );
      return rows as User[];
    } catch (error) {
      console.error('Error finding users by type:', error);
      throw error;
    } 
  }

}