import { Request, Response } from 'express';
import { AuthHelper } from '../utils/AuthHelper';
import { EventService } from '../services/EventService';

export class EventController {
    static async list(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            const { start, end, calendarId } = req.query;

            if (!start || !end) {
                return res.status(400).json({
                    success: false,
                    message: 'Los parámetros start y end son requeridos',
                });
            }

            const data = await EventService.listInRange(
                user,
                start as string,
                end as string,
                calendarId ? Number(calendarId) : undefined
            );
            res.json({ success: true, data });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 500;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            const data = await EventService.getById(Number(req.params.id), user);
            res.json({ success: true, data });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 404;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            const eventId = await EventService.create(req.body, user);
            res.status(201).json({ success: true, data: { eventId } });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            await EventService.update(Number(req.params.id), req.body, user);
            res.json({ success: true, message: 'Evento actualizado' });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async remove(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            await EventService.delete(Number(req.params.id), user);
            res.json({ success: true, message: 'Evento eliminado' });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async createException(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            const exceptionId = await EventService.createException(
                Number(req.params.id),
                req.body,
                user
            );
            res.status(201).json({ success: true, data: { exceptionId } });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }

    static async removeException(req: Request, res: Response) {
        try {
            const user = AuthHelper.getAuthenticatedUser(req);
            await EventService.deleteException(Number(req.params.exceptionId), user);
            res.json({ success: true, message: 'Excepción eliminada' });
        } catch (error: any) {
            const status = error.message?.includes('autorizado') ? 403 : 400;
            res.status(status).json({ success: false, message: error.message });
        }
    }
}
