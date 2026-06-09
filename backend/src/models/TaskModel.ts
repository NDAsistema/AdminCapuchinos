import { pool } from '../config/database';

export interface Task {
    id?: number;
    parent_task_id?: number | null;
    title: string;
    content: string;
    task_origin: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    due_date?: Date | null;
    is_recurring: boolean;
    recurrence_rule?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
    status: number;
    review_status?: 'pending' | 'approved' | 'rejected' | null;
    review_comment?: string | null;
    reviewed_by?: number | null;
    reviewed_at?: Date | null;
    created_by: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface TaskFilters {
    groupId?: string;
    userId?: string;
    brotherId?: string;
}

const TASK_DETAIL_SELECT = `
    SELECT DISTINCT t.*,
        creator_b.name AS userName,
        creator_u.type_user AS creator_type_user,
        parent.title AS parent_title,
        (
            SELECT g.name
            FROM task_assignments ta
            LEFT JOIN \`groups\` g ON ta.assigned_type = 2 AND g.id = ta.assigned_id
            WHERE ta.task_id = COALESCE(t.parent_task_id, t.id) AND ta.assigned_type = 2
            LIMIT 1
        ) AS groupName
    FROM tasks t
    LEFT JOIN tasks parent ON parent.id = t.parent_task_id
    LEFT JOIN users creator_u ON creator_u.id = t.created_by
    LEFT JOIN brothers creator_b ON creator_b.id = creator_u.id_brother
`;

export class TaskModel {
    static async create(task: Task, connection?: any): Promise<number> {
        const executor = connection || pool;
        const query = `
            INSERT INTO tasks (
                parent_task_id, title, content, task_origin, priority, 
                due_date, is_recurring, recurrence_rule, created_by,
                review_status, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `;
        const [result]: any = await executor.execute(query, [
            task.parent_task_id ?? null,
            task.title,
            task.content,
            task.task_origin,
            task.priority,
            task.due_date || null,
            task.is_recurring,
            task.recurrence_rule || null,
            task.created_by,
            task.review_status ?? null,
        ]);
        return result.insertId;
    }

    static async findById(id: number): Promise<any | null> {
        const [rows]: any = await pool.execute(
            `${TASK_DETAIL_SELECT} WHERE t.id = ? AND t.status = 1`,
            [id]
        );
        return rows[0] || null;
    }

    static async findUserReportForParent(parentTaskId: number, userId: number): Promise<any | null> {
        const [rows]: any = await pool.execute(
            `${TASK_DETAIL_SELECT}
             WHERE t.parent_task_id = ? AND t.created_by = ? AND t.task_origin = 2 AND t.status = 1
             LIMIT 1`,
            [parentTaskId, userId]
        );
        return rows[0] || null;
    }

    private static buildFilterClauses(filters: TaskFilters, params: any[]) {
        let sql = '';
        if (filters.groupId) {
            const groupId = Number(filters.groupId);
            sql += ` AND (
                EXISTS (
                    SELECT 1 FROM task_assignments ta
                    WHERE ta.task_id = COALESCE(t.parent_task_id, t.id)
                      AND ta.status = 1
                      AND (
                        (ta.assigned_type = 2 AND ta.assigned_id = ?)
                        OR (
                            ta.assigned_type = 1 AND EXISTS (
                                SELECT 1 FROM releations_groups_brotthers rgb
                                WHERE rgb.id_brotther = ta.assigned_id
                                  AND rgb.id_group = ? AND rgb.status = 1
                            )
                        )
                      )
                )
                OR EXISTS (
                    SELECT 1 FROM users ru
                    INNER JOIN releations_groups_brotthers rgb
                        ON rgb.id_brotther = ru.id_brother AND rgb.status = 1
                    WHERE ru.id = t.created_by AND rgb.id_group = ?
                )
            )`;
            params.push(groupId, groupId, groupId);
        }
        if (filters.userId) {
            sql += ` AND t.created_by = ?`;
            params.push(Number(filters.userId));
        }
        if (filters.brotherId) {
            sql += ` AND EXISTS (
                SELECT 1 FROM users filter_u
                WHERE filter_u.id = t.created_by AND filter_u.id_brother = ?
            )`;
            params.push(Number(filters.brotherId));
        }
        return sql;
    }

    private static async queryDetailed(whereSql: string, params: any[] = []) {
        const query = `${TASK_DETAIL_SELECT} WHERE t.status = 1 ${whereSql} ORDER BY t.created_at DESC`;
        const [rows] = await pool.execute(query, params);
        return rows as any[];
    }

    static async getAllTasksEnriched(filters: TaskFilters = {}): Promise<any[]> {
        const params: any[] = [];
        const extra = ` AND t.parent_task_id IS NULL AND t.task_origin IN (1, 3) ${this.buildFilterClauses(filters, params)}`;
        return this.queryDetailed(extra, params);
    }

    static async getUserReports(filters: TaskFilters = {}): Promise<any[]> {
        const params: any[] = [];
        const extra = ` AND t.task_origin = 2 AND t.parent_task_id IS NOT NULL ${this.buildFilterClauses(filters, params)}`;
        return this.queryDetailed(extra, params);
    }

    static async getManagementTasks(filters: TaskFilters = {}, createdBy?: number): Promise<any[]> {
        const params: any[] = [];
        let extra = ` AND t.task_origin IN (1, 3) AND t.parent_task_id IS NULL`;
        if (createdBy) {
            extra += ` AND t.created_by = ?`;
            params.push(createdBy);
        }
        extra += this.buildFilterClauses(filters, params);
        return this.queryDetailed(extra, params);
    }

    static async getCommsUserReports(brotherId: number | null, filters: TaskFilters = {}): Promise<any[]> {
        if (!brotherId) return [];

        const params: any[] = [brotherId, brotherId, brotherId];
        let extra = `
            AND t.task_origin = 2
            AND t.parent_task_id IS NOT NULL
            AND (
                EXISTS (
                    SELECT 1 FROM tasks pt
                    INNER JOIN task_assignments ta ON ta.task_id = pt.id AND ta.assigned_type = 2
                    INNER JOIN releations_home_groups rhg ON rhg.id_group = ta.assigned_id
                    INNER JOIN homes h ON h.id = rhg.id_home AND h.communication_user = ? AND h.status = 1
                    WHERE pt.id = t.parent_task_id
                )
                OR EXISTS (
                    SELECT 1 FROM tasks pt
                    INNER JOIN task_assignments ta ON ta.task_id = pt.id
                    INNER JOIN releations_groups_brotthers rgb ON rgb.id_group = ta.assigned_id AND ta.assigned_type = 2 AND rgb.status = 1
                    INNER JOIN releations_home_groups rhg ON rhg.id_group = rgb.id_group
                    INNER JOIN homes h ON h.id = rhg.id_home AND h.communication_user = ? AND h.status = 1
                    WHERE pt.id = t.parent_task_id AND t.created_by IN (
                        SELECT u.id FROM users u WHERE u.id_brother = rgb.id_brotther
                    )
                )
                OR EXISTS (
                    SELECT 1 FROM tasks pt
                    INNER JOIN task_assignments ta ON ta.task_id = pt.id AND ta.assigned_type = 1
                    INNER JOIN homes h ON h.communication_user = ?
                    WHERE pt.id = t.parent_task_id AND ta.assigned_id IN (
                        SELECT u.id_brother FROM users u WHERE u.id = t.created_by
                    )
                )
            )
        `;
        extra += this.buildFilterClauses(filters, params);
        return this.queryDetailed(extra, params);
    }

    static async getCommsManagementTasks(userId: number, filters: TaskFilters = {}): Promise<any[]> {
        const params: any[] = [userId];
        let extra = ` AND t.created_by = ? AND t.task_origin = 3 AND t.parent_task_id IS NULL`;
        extra += this.buildFilterClauses(filters, params);
        return this.queryDetailed(extra, params);
    }

    static async getRelatedUserReports(parentTaskId: number): Promise<any[]> {
        const query = `
            ${TASK_DETAIL_SELECT}
            WHERE t.status = 1
            AND t.task_origin = 2
            AND t.parent_task_id = ?
            ORDER BY t.created_at DESC
        `;
        const [rows] = await pool.execute(query, [parentTaskId]);
        return rows as any[];
    }

    /** Tareas maestras asignadas al usuario estándar */
    static async getAssignedMasterTasks(userId: number, brotherId: number | null): Promise<any[]> {
        if (!brotherId) return [];

        const query = `
            SELECT DISTINCT t.*,
                creator_b.name AS userName,
                creator_u.type_user AS creator_type_user,
                parent.title AS parent_title,
                (
                    SELECT g.name
                    FROM task_assignments ta
                    LEFT JOIN \`groups\` g ON ta.assigned_type = 2 AND g.id = ta.assigned_id
                    WHERE ta.task_id = COALESCE(t.parent_task_id, t.id) AND ta.assigned_type = 2
                    LIMIT 1
                ) AS groupName,
                (
                    SELECT tr.id FROM tasks tr
                    WHERE tr.parent_task_id = t.id AND tr.created_by = ? AND tr.task_origin = 2 AND tr.status = 1
                    LIMIT 1
                ) AS my_report_id,
                (
                    SELECT tr.review_status FROM tasks tr
                    WHERE tr.parent_task_id = t.id AND tr.created_by = ? AND tr.task_origin = 2 AND tr.status = 1
                    LIMIT 1
                ) AS my_review_status,
                (
                    SELECT tr.review_comment FROM tasks tr
                    WHERE tr.parent_task_id = t.id AND tr.created_by = ? AND tr.task_origin = 2 AND tr.status = 1
                    LIMIT 1
                ) AS my_review_comment
            FROM tasks t
            LEFT JOIN tasks parent ON parent.id = t.parent_task_id
            LEFT JOIN users creator_u ON creator_u.id = t.created_by
            LEFT JOIN brothers creator_b ON creator_b.id = creator_u.id_brother
            WHERE t.status = 1
            AND t.parent_task_id IS NULL
            AND t.task_origin IN (1, 3)
            AND EXISTS (
                SELECT 1 FROM task_assignments ta
                WHERE ta.task_id = t.id AND ta.status = 1
                AND (
                    ta.assigned_type = 0
                    OR (ta.assigned_type = 1 AND ta.assigned_id = ?)
                    OR (
                        ta.assigned_type = 2 AND ta.assigned_id IN (
                            SELECT rgb.id_group FROM releations_groups_brotthers rgb
                            WHERE rgb.id_brotther = ? AND rgb.status = 1
                        )
                    )
                )
            )
            ORDER BY t.due_date IS NULL, t.due_date ASC, t.created_at DESC
        `;
        const [rows] = await pool.execute(query, [
            userId, userId, userId,
            brotherId, brotherId,
        ]);
        return rows as any[];
    }

    static async updateReview(
        reportId: number,
        reviewStatus: 'approved' | 'rejected',
        comment: string | null,
        reviewerId: number
    ): Promise<boolean> {
        const [result]: any = await pool.execute(
            `UPDATE tasks SET review_status = ?, review_comment = ?, reviewed_by = ?, reviewed_at = NOW()
             WHERE id = ? AND task_origin = 2 AND status = 1`,
            [reviewStatus, comment, reviewerId, reportId]
        );
        return (result.affectedRows ?? 0) > 0;
    }

    static async userCanAccessMasterTask(
        taskId: number,
        userId: number,
        brotherId: number | null
    ): Promise<boolean> {
        if (!brotherId) return false;
        const [rows]: any = await pool.execute(
            `SELECT 1 FROM tasks t
             INNER JOIN task_assignments ta ON ta.task_id = t.id AND ta.status = 1
             WHERE t.id = ? AND t.status = 1 AND t.parent_task_id IS NULL
             AND (
                ta.assigned_type = 0
                OR (ta.assigned_type = 1 AND ta.assigned_id = ?)
                OR (
                    ta.assigned_type = 2 AND ta.assigned_id IN (
                        SELECT rgb.id_group FROM releations_groups_brotthers rgb
                        WHERE rgb.id_brotther = ? AND rgb.status = 1
                    )
                )
             )
             LIMIT 1`,
            [taskId, brotherId, brotherId]
        );
        return rows.length > 0;
    }

    static async userCanReviewReport(
        reportId: number,
        userId: number,
        brotherId: number | null,
        typeUser: number
    ): Promise<boolean> {
        const report = await this.findById(reportId);
        if (!report || report.task_origin !== 2 || !report.parent_task_id) return false;
        if (typeUser === 1) return true;

        const parentId = report.parent_task_id;

        if (typeUser === 3 && brotherId) {
            const inScope = await this.isParentTaskInCommsScope(parentId, brotherId);
            if (inScope) return true;
        }

        if (brotherId) {
            const [rows]: any = await pool.execute(
                `SELECT 1 FROM task_assignments ta
                 INNER JOIN releations_groups_brotthers rgb ON ta.assigned_type = 2 AND rgb.id_group = ta.assigned_id
                 WHERE ta.task_id = ? AND rgb.id_brotther = ? AND rgb.leader = 1 AND rgb.status = 1
                 LIMIT 1`,
                [parentId, brotherId]
            );
            if (rows.length > 0) return true;
        }

        if (typeUser === 2 && brotherId) {
            const [memberRows]: any = await pool.execute(
                `SELECT 1 FROM users ru
                 INNER JOIN releations_groups_brotthers rgb
                    ON rgb.id_brotther = ru.id_brother AND rgb.status = 1
                 INNER JOIN releations_groups_brotthers leader_rgb
                    ON leader_rgb.id_group = rgb.id_group
                    AND leader_rgb.leader = 1 AND leader_rgb.status = 1
                 WHERE ru.id = ? AND leader_rgb.id_brotther = ?
                 LIMIT 1`,
                [report.created_by, brotherId]
            );
            if (memberRows.length > 0) return true;

            const [parentRows]: any = await pool.execute(
                `SELECT 1 FROM tasks pt
                 INNER JOIN users leader_u ON leader_u.id_brother = ?
                 WHERE pt.id = ? AND pt.created_by = leader_u.id
                 LIMIT 1`,
                [brotherId, parentId]
            );
            if (parentRows.length > 0) return true;
        }

        return false;
    }

    /** Tarea padre dentro del alcance de fraternidades del usuario de comunicaciones */
    static async isParentTaskInCommsScope(
        parentTaskId: number,
        communicationBrotherId: number
    ): Promise<boolean> {
        const [rows]: any = await pool.execute(
            `SELECT 1 FROM tasks pt
             INNER JOIN task_assignments ta ON ta.task_id = pt.id AND ta.status = 1
             WHERE pt.id = ?
             AND (
                (ta.assigned_type = 2 AND EXISTS (
                    SELECT 1 FROM releations_home_groups rhg
                    INNER JOIN homes h ON h.id = rhg.id_home AND h.communication_user = ? AND h.status = 1
                    WHERE rhg.id_group = ta.assigned_id
                ))
                OR (ta.assigned_type = 1 AND EXISTS (
                    SELECT 1 FROM releations_groups_brotthers rgb
                    INNER JOIN releations_home_groups rhg ON rhg.id_group = rgb.id_group
                    INNER JOIN homes h ON h.id = rhg.id_home AND h.communication_user = ? AND h.status = 1
                    WHERE rgb.id_brotther = ta.assigned_id AND rgb.status = 1
                ))
                OR (ta.assigned_type = 0 AND EXISTS (
                    SELECT 1 FROM homes h WHERE h.communication_user = ? AND h.status = 1
                ))
             )
             LIMIT 1`,
            [parentTaskId, communicationBrotherId, communicationBrotherId, communicationBrotherId]
        );
        return rows.length > 0;
    }

    static async isGroupLeader(brotherId: number | null): Promise<boolean> {
        if (!brotherId) return false;
        const [rows]: any = await pool.execute(
            `SELECT 1 FROM releations_groups_brotthers
             WHERE id_brotther = ? AND leader = 1 AND status = 1 LIMIT 1`,
            [brotherId]
        );
        return rows.length > 0;
    }

    static async getLeaderUserReports(
        leaderBrotherId: number,
        filters: TaskFilters = {}
    ): Promise<any[]> {
        const params: any[] = [leaderBrotherId, leaderBrotherId];
        let extra = `
            AND t.task_origin = 2
            AND t.parent_task_id IS NOT NULL
            AND (
                EXISTS (
                    SELECT 1 FROM users ru
                    INNER JOIN releations_groups_brotthers rgb
                        ON rgb.id_brotther = ru.id_brother AND rgb.status = 1
                    INNER JOIN releations_groups_brotthers leader_rgb
                        ON leader_rgb.id_group = rgb.id_group
                        AND leader_rgb.leader = 1 AND leader_rgb.status = 1
                    WHERE ru.id = t.created_by AND leader_rgb.id_brotther = ?
                )
                OR EXISTS (
                    SELECT 1 FROM tasks pt
                    INNER JOIN users leader_u ON leader_u.id_brother = ?
                    WHERE pt.id = t.parent_task_id AND pt.created_by = leader_u.id
                )
            )
        `;
        extra += this.buildFilterClauses(filters, params);
        return this.queryDetailed(extra, params);
    }

    static async getLeaderManagementTasks(
        userId: number,
        filters: TaskFilters = {}
    ): Promise<any[]> {
        const params: any[] = [userId];
        let extra = `
            AND t.created_by = ?
            AND t.parent_task_id IS NULL
            AND t.task_origin = 2
        `;
        extra += this.buildFilterClauses(filters, params);
        return this.queryDetailed(extra, params);
    }

    static async validateLeaderAssignments(
        leaderBrotherId: number,
        assignedType: number,
        assignedIds: number[]
    ): Promise<void> {
        if (assignedType === 0) {
            throw new Error('Como líder solo puedes asignar a personas o grupos de tu cargo');
        }

        if (assignedType === 2) {
            for (const groupId of assignedIds) {
                const [rows]: any = await pool.execute(
                    `SELECT 1 FROM releations_groups_brotthers
                     WHERE id_group = ? AND id_brotther = ? AND leader = 1 AND status = 1 LIMIT 1`,
                    [groupId, leaderBrotherId]
                );
                if (!rows.length) {
                    throw new Error('Solo puedes asignar a grupos que lideras');
                }
            }
            return;
        }

        if (assignedType === 1) {
            for (const brotherId of assignedIds) {
                const [rows]: any = await pool.execute(
                    `SELECT 1 FROM releations_groups_brotthers rgb
                     INNER JOIN releations_groups_brotthers leader_rgb
                        ON leader_rgb.id_group = rgb.id_group
                        AND leader_rgb.leader = 1 AND leader_rgb.status = 1
                     WHERE rgb.id_brotther = ? AND rgb.status = 1
                       AND leader_rgb.id_brotther = ? LIMIT 1`,
                    [brotherId, leaderBrotherId]
                );
                if (!rows.length) {
                    throw new Error('Solo puedes asignar a miembros de tus grupos');
                }
            }
        }
    }
}
