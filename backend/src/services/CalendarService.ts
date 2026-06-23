import { pool } from '../config/database';
import { CalendarModel } from '../models/CalendarModel';
import { CalendarAssignmentModel } from '../models/CalendarAssignmentModel';

interface AuthUser {
    id: number;
    id_brother: number | null;
    type_user: number;
    name_brother?: string;
}

interface CalendarInput {
    name: string;
    description?: string;
    color?: string;
    assignments?: { assigned_type: number; assigned_id: number }[];
}

const CALENDAR_COLOR_PALETTE = [
    '#465fff',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#06b6d4',
    '#ec4899',
    '#14b8a6',
];

export class CalendarService {
    private static async pickDefaultColor(): Promise<string> {
        const [rows]: any = await pool.query(
            'SELECT COUNT(*) AS cnt FROM calendars WHERE status = 1'
        );
        const cnt = Number(rows[0]?.cnt ?? 0);
        return CALENDAR_COLOR_PALETTE[cnt % CALENDAR_COLOR_PALETTE.length];
    }

    static canManage(user: AuthUser): boolean {
        return user.type_user === 1 || user.type_user === 3;
    }

    static async listForUser(user: AuthUser) {
        let calendars: any[];
        if (user.type_user === 1) {
            calendars = await CalendarModel.findAllActive();
        } else if (user.type_user === 3 && user.id_brother) {
            calendars = await CalendarModel.findVisibleForUser(user.id, user.id_brother);
        } else {
            calendars = await CalendarModel.findVisibleForUser(user.id, user.id_brother);
        }

        return Promise.all(
            calendars.map(async (cal) => ({
                ...cal,
                canManage: await CalendarModel.userCanManage(
                    cal.id,
                    user.id,
                    user.type_user,
                    user.id_brother
                ),
            }))
        );
    }

    static async getVisibleCalendarIds(user: AuthUser): Promise<number[]> {
        const calendars = await this.listForUser(user);
        return calendars.map((c: { id: number }) => c.id);
    }

    static async getById(calendarId: number, user: AuthUser) {
        const canView = await CalendarModel.userCanView(calendarId, user.id, user.id_brother);
        if (!canView && user.type_user !== 1) {
            throw new Error('No autorizado');
        }

        const calendar = await CalendarModel.findById(calendarId);
        if (!calendar) throw new Error('Calendario no encontrado');

        const assignments = await CalendarAssignmentModel.findByCalendarId(calendarId);
        const canManage = await CalendarModel.userCanManage(
            calendarId,
            user.id,
            user.type_user,
            user.id_brother
        );

        return { ...calendar, assignments, canManage };
    }

    static async create(data: CalendarInput, user: AuthUser) {
        if (!this.canManage(user)) {
            throw new Error('No autorizado para crear calendarios');
        }

        if (!data.name?.trim()) {
            throw new Error('El nombre del calendario es requerido');
        }

        const assignments = data.assignments?.length
            ? data.assignments
            : user.type_user === 1
                ? [{ assigned_type: 0, assigned_id: 0 }]
                : [];

        if (user.type_user === 3) {
            if (!user.id_brother) {
                throw new Error('No autorizado para crear calendarios');
            }
            await CalendarModel.validateCommsAssignments(user.id_brother, assignments);
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const calendarColor = data.color || (await this.pickDefaultColor());

            const calendarId = await CalendarModel.create(
                {
                    name: data.name.trim(),
                    description: data.description || null,
                    color: calendarColor,
                    created_by: user.id,
                },
                connection
            );

            await CalendarAssignmentModel.createMultiple(calendarId, assignments, connection);

            await connection.commit();
            return calendarId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async update(calendarId: number, data: CalendarInput, user: AuthUser) {
        const canManage = await CalendarModel.userCanManage(
            calendarId,
            user.id,
            user.type_user,
            user.id_brother
        );
        if (!canManage) throw new Error('No autorizado');

        const calendar = await CalendarModel.findById(calendarId);
        if (!calendar) throw new Error('Calendario no encontrado');

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            await CalendarModel.update(
                calendarId,
                {
                    name: data.name?.trim() || calendar.name,
                    description: data.description ?? calendar.description,
                    color: data.color ?? calendar.color,
                },
                connection
            );

            if (data.assignments) {
                if (user.type_user === 3) {
                    if (!user.id_brother) {
                        throw new Error('No autorizado');
                    }
                    await CalendarModel.validateCommsAssignments(user.id_brother, data.assignments);
                }
                await CalendarAssignmentModel.replaceAll(calendarId, data.assignments, connection);
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async delete(calendarId: number, user: AuthUser) {
        const canManage = await CalendarModel.userCanManage(
            calendarId,
            user.id,
            user.type_user,
            user.id_brother
        );
        if (!canManage) throw new Error('No autorizado');

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            await CalendarAssignmentModel.softDeleteByCalendar(calendarId, connection);
            await CalendarModel.softDelete(calendarId, connection);
            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}
