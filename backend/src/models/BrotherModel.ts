// src/models/BrotherModel.ts
import { pool } from '../config/database';

export interface Brother {
  id: number;
  name: string;
  email: string;
  study: string;
  cv: string;
  birth_date: string | null;  // Permitir null
  server: string;
  year_profession: string | null;  // Permitir null
  img: string | null;
  status?: boolean;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface TypeUserServices {
  id: number;
  name: string;
  created_at?: Date;
  updated_at?: Date;
}

export class BrotherModel {
  // Crear nuevo hermano
  static async create(brotherData: Omit<Brother, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<Brother> {
    const {
      name,
      email,
      study,
      cv,
      birth_date,
      server,
      year_profession,
      img,
      created_by
    } = brotherData;

    const query = `
      INSERT INTO brothers (name, email, study, cv, birth_date, server, year_profession, img, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Asegurar que ningún valor sea undefined
    const values = [
      name || '',
      email || '',
      study || '',
      cv || '',
      birth_date || null,  // Usar null para campos de fecha vacíos
      server || '',
      year_profession || null,  // Usar null para campos de fecha vacíos
      img || null,
      created_by
    ];
    
    const [result] = await pool.execute(query, values) as any;
    const [newBrother] = await pool.execute('SELECT * FROM brothers WHERE id = ?', [result.insertId]) as any;
    
    return newBrother[0];
  }

  // Obtener hermano por ID
  static async findById(id: number): Promise<Brother | null> {
    const [rows] = await pool.execute('SELECT * FROM brothers WHERE id = ?', [id]) as any;
    return rows[0] || null;
  }

  // Obtener hermano por email - CORREGIDO
  static async findByEmail(email: string): Promise<Brother | null> {
    if (!email) {
      return null;
    }
    const [rows] = await pool.execute('SELECT * FROM brothers WHERE email = ?', [email || '']) as any;
    return rows[0] || null;
  }

  // Obtener todos los hermanos
  static async findAll(): Promise<Brother[]> {
    const [rows] = await pool.execute('SELECT b.*, tus.name as name_service from brothers as b LEFT JOIN type_user_services tus on (tus.id = b.server)') as any;
    return rows;
  }

  // Actualizar hermano - CORREGIDO
  static async update(id: number, brotherData: Partial<Brother>): Promise<Brother | null> {
    const allowedFields = ['name', 'email', 'study', 'cv', 'birth_date', 'server', 'year_profession', 'img', 'status', 'created_by'];
    const updates: string[] = [];
    const values: any[] = [];

    Object.keys(brotherData).forEach(key => {
      if (allowedFields.includes(key) && brotherData[key as keyof Brother] !== undefined) {
        updates.push(`${key} = ?`);
        const value = brotherData[key as keyof Brother];
        if (value === undefined) {
          values.push(null);
        } else if (value === '') {
          if (key === 'birth_date' || key === 'year_profession') {
            values.push(null);
          } else {
            values.push(value);
          }
        } else {
          values.push(value);
        }
      }
    });

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `
      UPDATE brothers 
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await pool.execute(query, values);
    return await this.findById(id);
  }

  static async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute('DELETE FROM brothers WHERE id = ?', [id]) as any;
    return result.affectedRows > 0;
  }

  // buscar hermanos para guardian de fraternidad
  static async findBrothersForGuardian(): Promise<Brother[]> {
    const [rows] = await pool.execute('SELECT b.id as id, b.name as name, tup.name as name_service FROM brothers b LEFT JOIN type_user_services tup on (tup.id = b.server) where b.status = 1 and b.server in (1,5,7)') as any;
    return rows;
  }

  // buscar hermanos para parroco
  static async findBrothersForParishPriest(): Promise<Brother[]> {
    const [rows] = await pool.execute('SELECT b.id as id, b.name as name, tup.name as name_service FROM brothers b LEFT JOIN type_user_services tup on (tup.id = b.server) where b.status = 1 and b.server in (1,3,4)') as any;
    return rows;
  }

  static async getListTypeUserServices(): Promise<TypeUserServices[]> {
    const [rows] = await pool.execute('SELECT * FROM type_user_services') as any;
    return rows;
  }

  // buscar hermanos para crear usuarios 
  static async searchListBrotherByCreateUsers(): Promise<Brother[]> {
    const [rows] = await pool.execute('SELECT b.id, b.name, b.email, b.server, tus.name as nameserver FROM brothers as b LEFT JOIN users as u ON (u.id_brother != b.id) LEFT JOIN type_user_services as tus ON (tus.id = b.server) WHERE b.status = 1 GROUP BY b.id, b.name, b.email, b.server, tus.name ORDER BY b.name') as any;
    return rows;
  }

  /** Hermanos en grupos de fraternidades del responsable de comunicaciones */
  static async findUsersInCommsScope(
    communicationBrotherId: number,
    groupId?: number
  ): Promise<any[]> {
    const groupClause = groupId ? ' AND rgb.id_group = ?' : '';
    const [rows] = await pool.execute(
      `SELECT DISTINCT
          b.id AS brotherId,
          b.name AS name,
          u.id AS userId
       FROM brothers b
       INNER JOIN releations_groups_brotthers rgb ON rgb.id_brotther = b.id AND rgb.status = 1
       INNER JOIN releations_home_groups rhg ON rhg.id_group = rgb.id_group
       INNER JOIN homes h ON h.id = rhg.id_home AND h.status = 1 AND h.communication_user = ?
       INNER JOIN \`groups\` g ON g.id = rgb.id_group AND g.status = 1
       LEFT JOIN users u ON u.id_brother = b.id AND u.status = 1 AND u.type_user = 2
       WHERE b.status = 1
         AND b.id <> ?
         AND NOT EXISTS (
           SELECT 1 FROM users ux
           WHERE ux.id_brother = b.id AND ux.status = 1 AND ux.type_user IN (1, 3)
         )${groupClause}
       ORDER BY b.name ASC`,
      groupId
        ? [communicationBrotherId, communicationBrotherId, groupId]
        : [communicationBrotherId, communicationBrotherId]
    );
    return rows as any[];
  }

  /** Hermanos en grupos donde el usuario es líder */
  static async findMembersInLedGroups(
    leaderBrotherId: number,
    groupId?: number
  ): Promise<any[]> {
    const groupClause = groupId ? ' AND rgb.id_group = ?' : '';
    const params = groupId
      ? [leaderBrotherId, leaderBrotherId, groupId]
      : [leaderBrotherId, leaderBrotherId];

    const [rows] = await pool.execute(
      `SELECT DISTINCT
          b.id AS brotherId,
          b.name AS name,
          u.id AS userId
       FROM brothers b
       INNER JOIN releations_groups_brotthers rgb ON rgb.id_brotther = b.id AND rgb.status = 1
       INNER JOIN releations_groups_brotthers leader_rgb
          ON leader_rgb.id_group = rgb.id_group
          AND leader_rgb.leader = 1 AND leader_rgb.status = 1
       INNER JOIN \`groups\` g ON g.id = rgb.id_group AND g.status = 1
       LEFT JOIN users u ON u.id_brother = b.id AND u.status = 1 AND u.type_user = 2
       WHERE b.status = 1
         AND leader_rgb.id_brotther = ?
         AND b.id <> ?
         AND NOT EXISTS (
           SELECT 1 FROM users ux
           WHERE ux.id_brother = b.id AND ux.status = 1 AND ux.type_user IN (1, 3)
         )${groupClause}
       ORDER BY b.name ASC`,
      params
    );
    return rows as any[];
  }

  /** Hermanos activos de uno o más grupos */
  static async getBrotherIdsByGroupIds(
    groupIds: number[],
    excludeBrotherId?: number
  ): Promise<number[]> {
    if (!groupIds.length) return [];
    const placeholders = groupIds.map(() => '?').join(', ');
    const params: any[] = [...groupIds];
    let excludeClause = '';
    if (excludeBrotherId) {
      excludeClause = ' AND rgb.id_brotther <> ?';
      params.push(excludeBrotherId);
    }
    const [rows] = await pool.execute(
      `SELECT DISTINCT rgb.id_brotther AS brotherId
       FROM releations_groups_brotthers rgb
       WHERE rgb.id_group IN (${placeholders}) AND rgb.status = 1${excludeClause}`,
      params
    );
    return (rows as any[]).map((r) => Number(r.brotherId));
  }

  /** Usuarios estándar que pertenecen a un grupo (filtros admin) */
  static async findStandardUsersInGroup(groupId: number): Promise<any[]> {
    const [rows] = await pool.execute(
      `SELECT DISTINCT u.id AS userId, b.id AS brotherId, b.name AS name
       FROM releations_groups_brotthers rgb
       INNER JOIN brothers b ON b.id = rgb.id_brotther AND b.status = 1
       INNER JOIN users u ON u.id_brother = b.id AND u.type_user = 2 AND u.status = 1
       WHERE rgb.id_group = ? AND rgb.status = 1
       ORDER BY b.name ASC`,
      [groupId]
    );
    return rows as any[];
  }
  
}