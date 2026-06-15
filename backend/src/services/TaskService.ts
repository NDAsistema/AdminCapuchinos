import { pool } from '../config/database';
import { TaskModel, Task, TaskFilters } from '../models/TaskModel';
import { BrotherModel } from '../models/BrotherModel';
import { TaskAssignmentModel } from '../models/TaskAssignmentModel';
import { AttachmentController } from '../controllers/AttachmentController';
import { NotificationService } from './NotificationService';

export type TaskListView = 'reportes' | 'gestion' | 'default';

interface ListQuery {
    view?: string;
    groupId?: string;
    userId?: string;
    brotherId?: string;
}

interface AuthUser {
    id: number;
    id_brother: number | null;
    type_user: number;
}

interface TaskCreator extends AuthUser {}

export class TaskService {
    static async listTasksForUser(user: AuthUser, query: ListQuery = {}) {
        const view = (query.view as TaskListView) || 'default';
        const filters: TaskFilters = {
            groupId: query.groupId || undefined,
            userId: query.userId || undefined,
            brotherId: query.brotherId || undefined,
        };
        const role = Number(user.type_user);

        if (role === 1) {
            if (view === 'reportes') {
                return TaskModel.getUserReports(filters);
            }
            if (view === 'gestion') {
                return TaskModel.getManagementTasks(filters, user.id);
            }
            return TaskModel.getAllTasksEnriched(filters);
        }

        if (role === 3) {
            if (view === 'gestion') {
                const informes = await TaskModel.getCommsManagementTasks(user.id, filters);
                const withRelated = await Promise.all(
                    informes.map(async (informe) => ({
                        ...informe,
                        relatedReports: await TaskModel.getRelatedUserReports(informe.id),
                    }))
                );
                return withRelated;
            }
            return TaskModel.getCommsUserReports(user.id_brother, filters);
        }

        if (role === 2 && user.id_brother) {
            const isLeader = await TaskModel.isGroupLeader(user.id_brother);
            if (isLeader) {
                if (view === 'reportes') {
                    return TaskModel.getLeaderUserReports(user.id_brother, filters);
                }
                if (view === 'gestion') {
                    return TaskModel.getLeaderManagementTasks(user.id, filters);
                }
            }
        }

        return TaskModel.getAssignedMasterTasks(user.id, user.id_brother);
    }

    static async getTaskDetail(taskId: number, user: AuthUser) {
        const task = await TaskModel.findById(taskId);
        if (!task) throw new Error('Tarea no encontrada');

        if (task.task_origin === 2 && task.parent_task_id) {
            const canReview = await TaskModel.userCanReviewReport(
                task.id,
                user.id,
                user.id_brother,
                user.type_user
            );
            if (
                !canReview &&
                task.created_by !== user.id &&
                Number(user.type_user) !== 1 &&
                Number(user.type_user) !== 3
            ) {
                throw new Error('No autorizado');
            }
            const parent = await TaskModel.findById(task.parent_task_id);
            return { ...task, parent, canReview };
        }

        const canAccess =
            Number(user.type_user) === 1 ||
            Number(user.type_user) === 3 ||
            task.created_by === user.id ||
            (await TaskModel.userCanAccessMasterTask(taskId, user.id, user.id_brother));

        if (!canAccess) throw new Error('No autorizado');

        const assignments = await TaskAssignmentModel.findEnrichedByTaskId(taskId);
        const { assigned_type, assigned_ids } =
            TaskAssignmentModel.deriveSummary(assignments);

        const myReport = await TaskModel.findUserReportForParent(taskId, user.id);
        return {
            ...task,
            assignments,
            assigned_type,
            assigned_ids,
            myReport,
            canSubmit: !myReport && user.type_user === 2,
        };
    }

    static async submitReport(
        parentTaskId: number,
        content: string,
        title: string | undefined,
        user: AuthUser
    ) {
        if (user.type_user !== 2) {
            throw new Error('Solo usuarios estándar pueden enviar informes');
        }

        const canAccess = await TaskModel.userCanAccessMasterTask(
            parentTaskId,
            user.id,
            user.id_brother
        );
        if (!canAccess) throw new Error('No tienes acceso a esta tarea');

        const existing = await TaskModel.findUserReportForParent(parentTaskId, user.id);
        if (existing) throw new Error('Ya enviaste un informe para esta tarea');

        const parent = await TaskModel.findById(parentTaskId);
        if (!parent) throw new Error('Tarea no encontrada');

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const reportTask: Task = {
                parent_task_id: parentTaskId,
                title: title?.trim() || `Informe: ${parent.title}`,
                content: content.trim(),
                task_origin: 2,
                priority: parent.priority,
                due_date: null,
                is_recurring: false,
                recurrence_rule: null,
                created_by: user.id,
                status: 1,
                review_status: 'pending',
            };

            const reportId = await TaskModel.create(reportTask, connection);
            await AttachmentController.extractAndBindImages(reportId, content);

            await connection.execute(
                `UPDATE task_assignments SET is_completed = 1, completed_at = NOW()
                 WHERE task_id = ? AND status = 1`,
                [parentTaskId]
            );

            const [userRow]: any = await connection.execute(
                `SELECT b.name AS name FROM users u LEFT JOIN brothers b ON b.id = u.id_brother WHERE u.id = ?`,
                [user.id]
            );

            await NotificationService.notifyReportSubmitted({
                reportId,
                parentTaskId,
                parentTitle: parent.title,
                submitterUserId: user.id,
                submitterName: userRow[0]?.name || 'Usuario',
                connection,
            });

            await connection.commit();
            return reportId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async reviewReport(
        reportId: number,
        action: 'approve' | 'reject',
        comment: string | undefined,
        user: AuthUser
    ) {
        const canReview = await TaskModel.userCanReviewReport(
            reportId,
            user.id,
            user.id_brother,
            user.type_user
        );
        if (!canReview) throw new Error('No autorizado para revisar este informe');

        const report = await TaskModel.findById(reportId);
        if (!report || report.task_origin !== 2) {
            throw new Error('Informe no encontrado');
        }
        if (report.review_status !== 'pending') {
            throw new Error('Este informe ya fue revisado');
        }

        const reviewStatus = action === 'approve' ? 'approved' : 'rejected';
        const updated = await TaskModel.updateReview(
            reportId,
            reviewStatus,
            comment?.trim() || null,
            user.id
        );
        if (!updated) throw new Error('No se pudo actualizar el informe');

        await NotificationService.notifyReportReviewed({
            reportId,
            submitterUserId: report.created_by,
            parentTitle: report.parent_title || report.title,
            reviewStatus,
            comment: comment?.trim() || null,
            reviewerUserId: user.id,
        });

        return { reviewStatus };
    }

    private static async buildAssignmentRows(
        taskId: number,
        assignedType: number,
        assignedIds: number[],
        excludeBrotherId?: number | null
    ): Promise<{ rows: any[][]; notifyType: number; notifyIds: number[] }> {
        let assignmentsData: any[][] = [];
        let notifyType = assignedType;
        let notifyIds = assignedIds;

        if (assignedType === 0) {
            assignmentsData.push([taskId, 0, null]);
        } else if (assignedType === 2 && assignedIds.length > 0) {
            const brotherIds = await BrotherModel.getBrotherIdsByGroupIds(
                assignedIds,
                excludeBrotherId ?? undefined
            );
            if (brotherIds.length === 0) {
                throw new Error('El grupo seleccionado no tiene miembros asignables');
            }
            assignmentsData = brotherIds.map((brotherId) => [taskId, 1, brotherId]);
            notifyType = 1;
            notifyIds = brotherIds;
        } else if (assignedIds.length > 0) {
            assignmentsData = assignedIds.map((id) => [taskId, assignedType, id]);
        }

        return { rows: assignmentsData, notifyType, notifyIds };
    }

    private static async userCanEditMasterTask(task: any, user: AuthUser): Promise<boolean> {
        if (Number(user.type_user) === 1) return true;
        if (Number(user.type_user) === 3 && task.created_by === user.id) return true;
        if (task.created_by !== user.id) return false;
        if (Number(user.type_user) === 2 && user.id_brother) {
            return TaskModel.isGroupLeader(user.id_brother);
        }
        return false;
    }

    static async updateAndAssignTask(taskId: number, taskData: any, editor: TaskCreator) {
        const task = await TaskModel.findById(taskId);
        if (!task || task.parent_task_id) {
            throw new Error('Tarea no encontrada');
        }

        if (!(await this.userCanEditMasterTask(task, editor))) {
            throw new Error('No autorizado para editar esta tarea');
        }

        const role = Number(editor.type_user);
        const assignedType = parseInt(taskData.assigned_type);
        const assignedIds = Array.isArray(taskData.assigned_ids)
            ? taskData.assigned_ids.map((id: number) => Number(id))
            : [];

        if (role === 2) {
            if (!editor.id_brother || !(await TaskModel.isGroupLeader(editor.id_brother))) {
                throw new Error('No autorizado para editar tareas');
            }
            await TaskModel.validateLeaderAssignments(
                editor.id_brother,
                assignedType,
                assignedIds
            );
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await TaskModel.updateMaster(
                taskId,
                {
                    title: taskData.title,
                    content: taskData.content,
                    priority: taskData.priority || 'medium',
                    due_date: taskData.due_date ? new Date(taskData.due_date) : null,
                    is_recurring: !!taskData.is_recurring,
                    recurrence_rule: taskData.is_recurring ? taskData.recurrence_rule : null,
                },
                connection
            );

            await AttachmentController.extractAndBindImages(taskId, taskData.content);

            const { rows } = await this.buildAssignmentRows(
                taskId,
                assignedType,
                assignedIds,
                editor.id_brother
            );

            const replaceRows = rows.map(([tid, type, aid]) => ({
                assigned_type: type,
                assigned_id: aid,
            }));

            await TaskAssignmentModel.replaceForTask(taskId, replaceRows, connection);

            await connection.commit();
            return taskId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async createAndAssignTask(taskData: any, creator: TaskCreator) {
        const role = Number(creator.type_user);
        const assignedType = parseInt(taskData.assigned_type);
        const assignedIds = Array.isArray(taskData.assigned_ids)
            ? taskData.assigned_ids.map((id: number) => Number(id))
            : [];

        if (role === 2) {
            if (!creator.id_brother || !(await TaskModel.isGroupLeader(creator.id_brother))) {
                throw new Error('No autorizado para crear tareas');
            }
            await TaskModel.validateLeaderAssignments(
                creator.id_brother,
                assignedType,
                assignedIds
            );
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const newTask: Task = {
                title: taskData.title,
                content: taskData.content,
                task_origin: creator.type_user,
                priority: taskData.priority || 'medium',
                due_date: taskData.due_date ? new Date(taskData.due_date) : null,
                is_recurring: !!taskData.is_recurring,
                recurrence_rule: taskData.is_recurring ? taskData.recurrence_rule : null,
                created_by: creator.id,
                status: 1,
            };

            const taskId = await TaskModel.create(newTask, connection);
            await AttachmentController.extractAndBindImages(taskId, taskData.content);

            const { rows: assignmentsData, notifyType, notifyIds } =
                await this.buildAssignmentRows(
                    taskId,
                    assignedType,
                    assignedIds,
                    creator.id_brother
                );

            if (assignmentsData.length > 0) {
                await TaskAssignmentModel.createMultiple(assignmentsData, connection);
            }

            const [creatorRows]: any = await connection.execute(
                `SELECT b.name AS name_brother FROM users u
                 LEFT JOIN brothers b ON b.id = u.id_brother WHERE u.id = ?`,
                [creator.id]
            );
            const creatorName = creatorRows[0]?.name_brother;

            await NotificationService.notifyTaskAssigned({
                taskId,
                title: taskData.title,
                assignedType: notifyType,
                assignedIds: notifyIds,
                creatorUserId: creator.id,
                creatorName,
                connection,
            });

            await connection.commit();
            return taskId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
