import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService';
import { AuthHelper } from '../utils/AuthHelper';

export class TaskController {

    static async createTask(req: Request, res: Response) {
        try {
            const creator = AuthHelper.getAuthenticatedUser(req);
            const taskId = await TaskService.createAndAssignTask(req.body, creator);
            res.status(201).json({
                success: true,
                data: { taskId },
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getAllTask(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            const { view, groupId, userId, brotherId } = req.query;
            const tasks = await TaskService.listTasksForUser(user, {
                view: view as string | undefined,
                groupId: groupId as string | undefined,
                userId: userId as string | undefined,
                brotherId: brotherId as string | undefined,
            });
            res.json({ success: true, data: tasks });
        } catch (error) {
            console.error('Error al obtener tareas:', error);
            res.status(500).json({ success: false, message: 'Error al obtener tareas' });
        }
    }

    static async getTaskDetail(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            const taskId = Number(req.params.id);
            const data = await TaskService.getTaskDetail(taskId, user);
            res.json({ success: true, data });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 404;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async submitReport(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            const parentTaskId = Number(req.params.id);
            const { content, title } = req.body;

            if (!content?.trim()) {
                return res.status(400).json({ success: false, message: 'El contenido del informe es requerido' });
            }

            const reportId = await TaskService.submitReport(parentTaskId, content, title, user);
            res.status(201).json({
                success: true,
                message: 'Informe enviado. Queda pendiente de revisión.',
                data: { reportId },
            });
        } catch (error: any) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    static async reviewReport(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            const reportId = Number(req.params.id);
            const { action, comment } = req.body;

            if (action !== 'approve' && action !== 'reject') {
                return res.status(400).json({ success: false, message: 'Acción inválida (approve o reject)' });
            }

            const result = await TaskService.reviewReport(reportId, action, comment, user);
            res.json({
                success: true,
                message: action === 'approve' ? 'Informe aprobado' : 'Informe rechazado',
                data: result,
            });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }
}
