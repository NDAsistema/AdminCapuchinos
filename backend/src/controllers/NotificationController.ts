import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { NotificationModel } from '../models/NotificationModel';

export class NotificationController {
    static async list(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'No autenticado' });
            }

            const limit = Math.min(Number(req.query.limit) || 30, 50);
            const notifications = await NotificationModel.findByUser(userId, limit);
            const unreadCount = await NotificationModel.countUnread(userId);

            return res.json({
                success: true,
                data: notifications,
                unreadCount,
            });
        } catch (error) {
            console.error('Error listando notificaciones:', error);
            return res.status(500).json({ success: false, message: 'Error al obtener notificaciones' });
        }
    }

    static async unreadCount(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'No autenticado' });
            }

            const count = await NotificationModel.countUnread(userId);
            return res.json({ success: true, unreadCount: count });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al contar notificaciones' });
        }
    }

    static async markRead(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            const id = Number(req.params.id);

            if (!userId || !id) {
                return res.status(400).json({ success: false, message: 'Datos inválidos' });
            }

            const updated = await NotificationModel.markAsRead(id, userId);
            const unreadCount = await NotificationModel.countUnread(userId);

            return res.json({ success: true, updated, unreadCount });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al marcar notificación' });
        }
    }

    static async markAllRead(req: AuthRequest, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: 'No autenticado' });
            }

            const marked = await NotificationModel.markAllAsRead(userId);
            return res.json({ success: true, marked, unreadCount: 0 });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error al marcar notificaciones' });
        }
    }
}
