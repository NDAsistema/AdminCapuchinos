import { pool } from '../config/database';

export interface TaskRead {
  user_id: number;
  assignment_id: number;
  read_at?: Date;
}

export class TaskReadModel {
  static async markAsRead(userId: number, assignmentId: number): Promise<void> {
    const query = `
      INSERT IGNORE INTO task_reads (user_id, assignment_id)
      VALUES (?, ?)
    `;
    await pool.execute(query, [userId, assignmentId]);
  }

  // Verifica si un usuario ya leyó una tarea específica
  static async hasBeenRead(userId: number, assignmentId: number): Promise<boolean> {
    const [rows]: any = await pool.execute(
      'SELECT 1 FROM task_reads WHERE user_id = ? AND assignment_id = ?',
      [userId, assignmentId]
    );
    return rows.length > 0;
  }
}