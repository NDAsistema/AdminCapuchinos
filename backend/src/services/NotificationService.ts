import { pool } from '../config/database';
import { NotificationModel } from '../models/NotificationModel';
import { EventReminderService } from './EventReminderService';

export class NotificationService {
    /**
     * Resuelve user_id de destinatarios según tipo de asignación de tarea.
     * assigned_type: 0=todos, 1=hermano(s), 2=grupo(s)
     */
    static async resolveTaskRecipientUserIds(
        assignedType: number,
        assignedIds: number[],
        excludeUserId: number
    ): Promise<number[]> {
        let query = '';
        let params: any[] = [];

        if (assignedType === 0) {
            query = 'SELECT id FROM users WHERE status = 1 AND id != ?';
            params = [excludeUserId];
        } else if (assignedType === 1 && assignedIds.length > 0) {
            const placeholders = assignedIds.map(() => '?').join(', ');
            query = `SELECT DISTINCT u.id FROM users u
                     WHERE u.status = 1 AND u.id_brother IN (${placeholders}) AND u.id != ?`;
            params = [...assignedIds, excludeUserId];
        } else if (assignedType === 2 && assignedIds.length > 0) {
            const placeholders = assignedIds.map(() => '?').join(', ');
            query = `SELECT DISTINCT u.id FROM users u
                     INNER JOIN releations_groups_brotthers rgb ON rgb.id_brotther = u.id_brother AND rgb.status = 1
                     WHERE u.status = 1 AND rgb.id_group IN (${placeholders}) AND u.id != ?`;
            params = [...assignedIds, excludeUserId];
        } else {
            return [];
        }

        const [rows]: any = await pool.execute(query, params);
        return rows.map((r: { id: number }) => Number(r.id));
    }

    static async notifyTaskAssigned(params: {
        taskId: number;
        title: string;
        assignedType: number;
        assignedIds: number[];
        creatorUserId: number;
        creatorName?: string;
        connection?: any;
    }): Promise<void> {
        const recipientIds = await this.resolveTaskRecipientUserIds(
            params.assignedType,
            params.assignedIds,
            params.creatorUserId
        );

        if (recipientIds.length === 0) return;

        const author = params.creatorName?.trim() || 'El sistema';
        const message = `${author} te asignó la tarea: ${params.title}`.slice(0, 500);

        const rows = recipientIds.map((userId) => ({
            user_id: userId,
            type: 'task_assigned',
            reference_id: params.taskId,
            message,
        }));

        await NotificationModel.createMany(rows, params.connection);
    }

    /** Revisores: admin, comunicaciones del alcance y líderes de grupo de la tarea */
    static async resolveReportReviewerUserIds(
        parentTaskId: number,
        excludeUserId: number
    ): Promise<number[]> {
        const [rows]: any = await pool.execute(
            `SELECT DISTINCT u.id FROM users u
             WHERE u.status = 1 AND u.id != ?
             AND (
                u.type_user = 1
                OR u.type_user = 3
                OR EXISTS (
                    SELECT 1 FROM task_assignments ta
                    INNER JOIN releations_groups_brotthers rgb ON ta.assigned_type = 2
                        AND rgb.id_group = ta.assigned_id AND rgb.leader = 1 AND rgb.status = 1
                    WHERE ta.task_id = ? AND rgb.id_brotther = u.id_brother
                )
             )`,
            [excludeUserId, parentTaskId]
        );
        return rows.map((r: { id: number }) => Number(r.id));
    }

    static async notifyReportSubmitted(params: {
        reportId: number;
        parentTaskId: number;
        parentTitle: string;
        submitterUserId: number;
        submitterName: string;
        connection?: any;
    }): Promise<void> {
        const recipientIds = await this.resolveReportReviewerUserIds(
            params.parentTaskId,
            params.submitterUserId
        );
        if (recipientIds.length === 0) return;

        const message = `${params.submitterName} envió un informe para revisar: ${params.parentTitle}`.slice(
            0,
            500
        );

        const rows = recipientIds.map((userId) => ({
            user_id: userId,
            type: 'report_submitted',
            reference_id: params.reportId,
            message,
        }));

        await NotificationModel.createMany(rows, params.connection);
    }

    static async notifyReportReviewed(params: {
        reportId: number;
        submitterUserId: number;
        parentTitle: string;
        reviewStatus: 'approved' | 'rejected';
        comment: string | null;
        reviewerUserId: number;
    }): Promise<void> {
        const label = params.reviewStatus === 'approved' ? 'aprobó' : 'rechazó';
        let message = `Tu informe "${params.parentTitle}" fue ${label}`;
        if (params.comment) {
            message += `. Comentario: ${params.comment}`;
        }
        message = message.slice(0, 500);

        await NotificationModel.createMany([
            {
                user_id: params.submitterUserId,
                type: params.reviewStatus === 'approved' ? 'report_approved' : 'report_rejected',
                reference_id: params.reportId,
                message,
            },
        ]);
    }

    static async notifyEventCreated(params: {
        eventId: number;
        title: string;
        calendarId: number;
        creatorUserId: number;
        creatorName?: string;
        connection?: any;
    }): Promise<void> {
        const recipientIds = await EventReminderService.resolveCalendarRecipientUserIds(
            params.calendarId,
            params.creatorUserId
        );
        if (recipientIds.length === 0) return;

        const author = params.creatorName?.trim() || 'El sistema';
        const message = `${author} creó el evento: ${params.title}`.slice(0, 500);

        const rows = recipientIds.map((userId) => ({
            user_id: userId,
            type: 'event_created',
            reference_id: params.eventId,
            message,
        }));

        await NotificationModel.createMany(rows, params.connection);
    }
}
