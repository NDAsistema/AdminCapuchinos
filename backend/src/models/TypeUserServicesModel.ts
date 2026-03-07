import { pool } from '../config/database';

export interface TypeUserServices {
  id?: number;
  name: string;
  status?: number;
}

export class TypeUserServicesModel {

  // Buscar todos los tipos de usuario de servicios
  static async findAll(): Promise<TypeUserServices[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM type_user_services WHERE status = 1 ORDER BY name ASC'
      );
      return rows as TypeUserServices[];
    } catch (error) {
      console.error('Error finding type user services:', error);
      throw error;
    } 
  }
}