import { Request, Response } from 'express';
import { AuthHelper } from '../utils/AuthHelper';
import { CalendarService } from '../services/CalendarService';

export class CalendarController {
    static async list(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            const data = await CalendarService.listForUser(user);
            res.json({ success: true, data });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            const data = await CalendarService.getById(Number(req.params.id), user);
            res.json({ success: true, data });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 404;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            const calendarId = await CalendarService.create(req.body, user);
            res.status(201).json({ success: true, data: { calendarId } });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            await CalendarService.update(Number(req.params.id), req.body, user);
            res.json({ success: true, message: 'Calendario actualizado' });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async remove(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            await CalendarService.delete(Number(req.params.id), user);
            res.json({ success: true, message: 'Calendario eliminado' });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }
}
