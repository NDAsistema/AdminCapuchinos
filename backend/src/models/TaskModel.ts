import { pool } from '../config/database';

export interface Task {
    id?: number;
    title: string;
    content: string;
    task_origin: number;   // 1:Admin, 2:Comms, 3:Líder, 4:Libre
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: Date | null;
    is_recurring: boolean;
    recurrence_rule?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
    status: number;
    created_by: number;
    created_at?: Date;
    updated_at?: Date;
}

export class TaskModel {
    static async create(task: Task, connection?: any): Promise<number> {
        const executor = connection || pool;
        const query = `
            INSERT INTO tasks (
                title, content, task_origin, priority, 
                due_date, is_recurring, recurrence_rule, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [result]: any = await executor.execute(query, [
            task.title, task.content, task.task_origin, task.priority, 
            task.due_date || null, task.is_recurring, task.recurrence_rule || null, task.created_by
        ]);
        return result.insertId;
    }

    static async getAllTasks(): Promise<Task[]> {
        const query = `SELECT * FROM tasks WHERE status = 1 ORDER BY created_at DESC`;
        const [rows] = await pool.execute(query);
        return rows as Task[];
    }

    static async getTasksByUser(userId: number): Promise<Task[]> {
        const query = `
            SELECT DISTINCT t.* FROM tasks t
            INNER JOIN task_assignments ta ON t.id = ta.task_id
            WHERE (ta.assigned_type = 1 AND ta.assigned_id = ?) 
               OR (ta.assigned_type = 0)
            AND t.status = 1
            ORDER BY t.created_at DESC
        `;
        const [rows] = await pool.execute(query, [userId]);
        return rows as Task[];
    }
}