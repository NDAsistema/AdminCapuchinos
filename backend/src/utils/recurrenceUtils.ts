import { RRule, Frequency, Weekday } from 'rrule';
import { RecurrenceRule } from '../models/EventModel';

const WEEKDAY_MAP: Record<number, Weekday> = {
    0: RRule.SU,
    1: RRule.MO,
    2: RRule.TU,
    3: RRule.WE,
    4: RRule.TH,
    5: RRule.FR,
    6: RRule.SA,
};

function toDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value);
}

function formatLocalDateTime(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function frequencyFromRule(rule: RecurrenceRule): Frequency {
    switch (rule) {
        case 'daily': return RRule.DAILY;
        case 'weekly': return RRule.WEEKLY;
        case 'monthly': return RRule.MONTHLY;
        case 'yearly': return RRule.YEARLY;
        default: return RRule.DAILY;
    }
}

function isLastWeekdayOfMonth(date: Date): boolean {
    const next = new Date(date);
    next.setDate(date.getDate() + 7);
    return next.getMonth() !== date.getMonth();
}

function applyMonthlyRecurrence(
    options: Partial<import('rrule').Options>,
    recurrenceDays: string | null | undefined,
    dtstart: Date
) {
    const trimmed = recurrenceDays?.trim();

    if (trimmed?.startsWith('last:')) {
        const weekday = Number(trimmed.split(':')[1]);
        if (weekday >= 0 && weekday <= 6) {
            options.byweekday = [WEEKDAY_MAP[weekday]];
            options.bysetpos = -1;
        }
        return;
    }

    if (trimmed) {
        const dayOfMonth = Number(trimmed);
        if (dayOfMonth >= 1 && dayOfMonth <= 31) {
            options.bymonthday = [dayOfMonth];
        }
        return;
    }

    if (isLastWeekdayOfMonth(dtstart)) {
        options.byweekday = [WEEKDAY_MAP[dtstart.getDay()]];
        options.bysetpos = -1;
    } else {
        options.bymonthday = [dtstart.getDate()];
    }
}

function applyYearlyRecurrence(
    options: Partial<import('rrule').Options>,
    recurrenceDays: string | null | undefined,
    dtstart: Date
) {
    const trimmed = recurrenceDays?.trim();

    if (trimmed && /^\d+-\d+$/.test(trimmed)) {
        const [month, day] = trimmed.split('-').map(Number);
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
            options.bymonth = [month];
            options.bymonthday = [day];
            return;
        }
    }

    options.bymonth = [dtstart.getMonth() + 1];
    options.bymonthday = [dtstart.getDate()];
}

export interface ExpandedOccurrence {
    originalStartAt: string;
    startAt: string;
    endAt: string;
}

export function expandEventOccurrences(
    master: {
        start_at: Date | string;
        end_at: Date | string;
        recurrence_rule: RecurrenceRule;
        recurrence_interval?: number;
        recurrence_end_date?: string | null;
        recurrence_count?: number | null;
        recurrence_days?: string | null;
    },
    rangeStart: Date,
    rangeEnd: Date
): ExpandedOccurrence[] {
    const start = toDate(master.start_at);
    const end = toDate(master.end_at);
    const durationMs = end.getTime() - start.getTime();

    const options: Partial<import('rrule').Options> = {
        freq: frequencyFromRule(master.recurrence_rule),
        interval: master.recurrence_interval ?? 1,
        dtstart: start,
    };

    if (master.recurrence_end_date) {
        const until = new Date(master.recurrence_end_date);
        until.setHours(23, 59, 59, 999);
        options.until = until;
    } else if (master.recurrence_count) {
        options.count = master.recurrence_count;
    }

    if (master.recurrence_rule === 'weekly' && master.recurrence_days) {
        const days = master.recurrence_days
            .split(',')
            .map((d) => Number(d.trim()))
            .filter((d) => d >= 0 && d <= 6)
            .map((d) => WEEKDAY_MAP[d]);
        if (days.length > 0) {
            options.byweekday = days;
        }
    }

    if (master.recurrence_rule === 'monthly') {
        applyMonthlyRecurrence(options, master.recurrence_days, start);
    }

    if (master.recurrence_rule === 'yearly') {
        applyYearlyRecurrence(options, master.recurrence_days, start);
    }

    const rule = new RRule(options);
    const dates = rule.between(rangeStart, rangeEnd, true);

    return dates.map((occurrenceStart) => {
        const occurrenceEnd = new Date(occurrenceStart.getTime() + durationMs);
        return {
            originalStartAt: formatLocalDateTime(occurrenceStart),
            startAt: formatLocalDateTime(occurrenceStart),
            endAt: formatLocalDateTime(occurrenceEnd),
        };
    });
}

export function buildInstanceId(eventId: number, originalStartAt: string): string {
    const normalized = originalStartAt.replace(' ', 'T');
    return `${eventId}_${normalized}`;
}
