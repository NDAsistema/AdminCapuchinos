import { pool } from '../config/database';

export interface TypeUserServices {
  id?: number;
  name: string;
  status?: number;
}

export class TypeUserModel {

  // Buscar todos los tipos de usuario
  static async findAll(): Promise<TypeUserServices[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM type_users'
      );
      return rows as TypeUserServices[];
    } catch (error) {
      console.error('Error finding type user services:', error);
      throw error;
    } 
  }
}