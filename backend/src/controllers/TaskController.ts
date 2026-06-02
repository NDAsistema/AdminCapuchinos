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
                data: { taskId } 
            });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getAllTask(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            const tasks = await TaskService.listTasksForUser(user);
            res.json({ success: true, data: tasks });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al obtener tareas' });
        }
    }
}