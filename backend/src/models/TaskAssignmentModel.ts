import { pool } from '../config/database';

export interface TaskAssignmentRow {
    assigned_type: number;
    assigned_id: number | null;
    assigned_name: string;
}

export class TaskAssignmentModel {
    static async createMultiple(assignments: any[][], connection?: any): Promise<void> {
        const executor = connection || pool;
        const query = `INSERT INTO task_assignments (task_id, assigned_type, assigned_id) VALUES ?`;
        await executor.query(query, [assignments]);
    }

    static async findEnrichedByTaskId(taskId: number): Promise<TaskAssignmentRow[]> {
        const [rows] = await pool.execute(
            `SELECT ta.assigned_type, ta.assigned_id,
                CASE
                    WHEN ta.assigned_type = 0 THEN 'Todos'
                    WHEN ta.assigned_type = 1 THEN COALESCE(b.name, CONCAT('Hermano #', ta.assigned_id))
                    WHEN ta.assigned_type = 2 THEN COALESCE(g.name, CONCAT('Grupo #', ta.assigned_id))
                    ELSE '—'
                END AS assigned_name
             FROM task_assignments ta
             LEFT JOIN brothers b ON ta.assigned_type = 1 AND b.id = ta.assigned_id
             LEFT JOIN \`groups\` g ON ta.assigned_type = 2 AND g.id = ta.assigned_id
             WHERE ta.task_id = ? AND ta.status = 1`,
            [taskId]
        );
        return rows as TaskAssignmentRow[];
    }

    static deriveSummary(assignments: TaskAssignmentRow[]) {
        if (!assignments.length) {
            return { assigned_type: 1, assigned_ids: [] as number[] };
        }
        if (assignments.some((a) => a.assigned_type === 0)) {
            return { assigned_type: 0, assigned_ids: [] as number[] };
        }
        if (assignments.some((a) => a.assigned_type === 2)) {
            const ids = [
                ...new Set(
                    assignments
                        .filter((a) => a.assigned_type === 2 && a.assigned_id != null)
                        .map((a) => Number(a.assigned_id))
                ),
            ];
            return { assigned_type: 2, assigned_ids: ids };
        }
        const ids = assignments
            .filter((a) => a.assigned_type === 1 && a.assigned_id != null)
            .map((a) => Number(a.assigned_id));
        return { assigned_type: 1, assigned_ids: ids };
    }

    static async replaceForTask(
        taskId: number,
        rows: { assigned_type: number; assigned_id: number | null }[],
        connection?: any
    ): Promise<void> {
        const executor = connection || pool;
        await executor.execute(
            `UPDATE task_assignments SET status = 0 WHERE task_id = ? AND status = 1`,
            [taskId]
        );
        if (rows.length === 0) return;
        const data = rows.map((r) => [taskId, r.assigned_type, r.assigned_id]);
        await this.createMultiple(data, connection);
    }
}
