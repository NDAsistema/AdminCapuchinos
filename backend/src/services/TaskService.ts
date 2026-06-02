import { pool } from '../config/database';
import { TaskModel, Task } from '../models/TaskModel';
import { TaskAssignmentModel } from '../models/TaskAssignmentModel';
import { AttachmentController } from '../controllers/attachmentController';

export class TaskService {
    static async listTasksForUser(user: { id: number, type_user: number }) {
        if (user.type_user === 1) {
            return await TaskModel.getAllTasks();
        }
        return await TaskModel.getTasksByUser(user.id);
    }

    static async createAndAssignTask(taskData: any, creator: { id: number, type_user: number }) {
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
                status: 1
            };

            const taskId = await TaskModel.create(newTask, connection);
            await AttachmentController.extractAndBindImages(taskId, taskData.content);
            let assignmentsData: any[][] = [];
            const assignedType = parseInt(taskData.assigned_type);

            if (assignedType === 0) {
                assignmentsData.push([taskId, 0, null]);
            } else if (Array.isArray(taskData.assigned_ids)) {
                assignmentsData = taskData.assigned_ids.map((id: number) => [taskId, assignedType, id]);
            }

            if (assignmentsData.length > 0) {
                await TaskAssignmentModel.createMultiple(assignmentsData, connection);
            }

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