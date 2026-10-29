import dayjs from 'dayjs';

const DATE_FORMAT = 'YYYY-MM-DD';

export type DueBadge = {
    label: string;
    color: 'error' | 'warning' | 'default';
};

// 이번 주기의 마지막 날. 주간은 월요일 시작이라 일요일이 마감
export function getCycleDueDate(cycle: string, today: Date): string {
    const year = today.getFullYear();
    const month = today.getMonth();
    const lastDayOf = (monthExclusive: number) =>
        dayjs(new Date(year, monthExclusive, 0)).format(DATE_FORMAT);

    switch (cycle) {
        case 'WEEK':
            return dayjs(today).add(6 - ((today.getDay() + 6) % 7), 'day').format(DATE_FORMAT);
        case 'MONTH':
            return lastDayOf(month + 1);
        case 'QUARTER':
            return lastDayOf(Math.floor(month / 3) * 3 + 3);
        case 'HALF':
            return lastDayOf(month < 6 ? 6 : 12);
        case 'YEAR':
            return lastDayOf(12);
        default:
            return dayjs(today).format(DATE_FORMAT);
    }
}

export function getDueBadge(dueDate: string, today: Date): DueBadge {
    const days = dayjs(dueDate).diff(dayjs(today).startOf('day'), 'day');
    if (days <= 0) {
        return { label: '오늘 마감', color: 'error' };
    }
    return { label: `D-${days}`, color: days <= 3 ? 'warning' : 'default' };
}

export function formatElapsed(value: string | undefined, today: Date): string {
    if (!value) {
        return '-';
    }
    const days = dayjs(today).startOf('day').diff(dayjs(value.slice(0, 10)), 'day');
    if (days <= 0) {
        return '오늘';
    }
    return days === 1 ? '어제' : `${days}일 전`;
}