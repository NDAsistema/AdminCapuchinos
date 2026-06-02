import { pool } from '../config/database';

export class TaskAssignmentModel {
    static async createMultiple(assignments: any[][], connection?: any): Promise<void> {
        const executor = connection || pool;
        const query = `INSERT INTO task_assignments (task_id, assigned_type, assigned_id) VALUES ?`;
        await executor.query(query, [assignments]);
    }
}