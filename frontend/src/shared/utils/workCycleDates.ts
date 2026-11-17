import dayjs, { type Dayjs } from 'dayjs';

// 업무 주기 기준. 백엔드 HaccpWorkCycleDates, DB fn_work_cycle_* 와 같은 규칙
export type WorkCycleAnchor = {
    startDate: string; // yyyy-MM-dd, 첫 주기 시작일
    type: 'DATE' | 'WEEKDAY';
    week: number | null; // 1~4, 9 = 마지막 주 (WEEKDAY 만)
    weekday: number | null; // 1(월)~7(일) (WEEKDAY 만)
};

export const LAST_WEEK = 9;

const FORMAT = 'YYYY-MM-DD';
const CYCLE_MONTHS: Record<string, number> = { MONTH: 1, QUARTER: 3, HALF: 6, YEAR: 12 };
const WEEKDAY_NAMES = ['월', '화', '수', '목', '금', '토', '일'];
const CYCLE_PREFIX: Record<string, string> = {
    WEEK: '매주',
    MONTH: '매월',
    QUARTER: '3개월마다',
    HALF: '6개월마다',
    YEAR: '매년',
};

// 월, 분기, 반기, 연간 주기 (주차 기준을 쓸 수 있는 주기)
export function isMonthlyOrLongerCycle(cycle: string): boolean {
    return Boolean(CYCLE_MONTHS[cycle]);
}

// 1(월)~7(일)
function isoWeekday(value: Dayjs): number {
    return ((value.day() + 6) % 7) + 1;
}

// 날짜가 속한 주(월~일)의 목요일이 있는 달의 1일 (주차 기준의 기준 달)
export function anchorMonthOf(date: string): string {
    const value = dayjs(date);
    return value.add(4 - isoWeekday(value), 'day').startOf('month').format(FORMAT);
}

// month 가 있는 달의 week째주(9 = 마지막 주) weekday 요일. 주는 목요일이 속한 달로 센다 (ISO, tb_week 와 같은 기준)
export function monthWeekDate(month: string, week: number, weekday: number): string {
    const first = dayjs(month).startOf('month');
    let thursday: Dayjs;
    if (week === LAST_WEEK) {
        const last = first.endOf('month').startOf('day');
        thursday = last.subtract((isoWeekday(last) - 4 + 7) % 7, 'day');
    } else {
        thursday = first.add((4 - isoWeekday(first) + 7) % 7, 'day').add(7 * (week - 1), 'day');
    }
    return thursday.subtract(3, 'day').add(weekday - 1, 'day').format(FORMAT);
}

// 업무 시작일 기준 n번째 주기 시작일. 월 단위는 매번 시작일에서 다시 더해 말일 보정이 누적되지 않게 한다
function boundary(cycle: string, anchor: WorkCycleAnchor, n: number): string {
    const start = dayjs(anchor.startDate);
    if (cycle === 'WEEK') {
        return start.add(7 * n, 'day').format(FORMAT);
    }
    const months = CYCLE_MONTHS[cycle] ?? 0;
    if (!months) {
        return start.add(n, 'day').format(FORMAT);
    }
    if (anchor.type === 'WEEKDAY') {
        const month = dayjs(anchorMonthOf(anchor.startDate)).add(months * n, 'month').format(FORMAT);
        return monthWeekDate(month, anchor.week ?? 1, anchor.weekday ?? 1);
    }
    return start.add(months * n, 'month').format(FORMAT);
}

// date 가 속한 주기 번호(0부터). 주차 기준은 경계가 앞뒤 달로 넘어가므로 양쪽 모두 맞춘다
function cycleIndex(cycle: string, anchor: WorkCycleAnchor, date: string): number {
    const target = dayjs(date);
    if (cycle === 'WEEK') {
        return Math.floor(target.diff(dayjs(anchor.startDate), 'day') / 7);
    }
    const months = CYCLE_MONTHS[cycle];
    const base = dayjs(anchor.type === 'WEEKDAY' ? anchorMonthOf(anchor.startDate) : anchor.startDate);
    let n = Math.max(0, Math.floor(((target.year() - base.year()) * 12 + target.month() - base.month()) / months));
    while (n > 0 && boundary(cycle, anchor, n) > date) {
        n -= 1;
    }
    while (boundary(cycle, anchor, n + 1) <= date) {
        n += 1;
    }
    return n;
}

function hasCycleBoundary(cycle: string): boolean {
    return cycle === 'WEEK' || isMonthlyOrLongerCycle(cycle);
}

// 업무 주기 기준 보고일자(yyyy-MM-dd).
// 기준 없음: WEEK 는 그 주 월요일, MONTH 는 1일, QUARTER 는 분기 첫날, HALF 는 1월 1일 또는 7월 1일, YEAR 는 1월 1일, 그 외는 고른 날짜
// 기준 있음: 업무 시작일부터 센 주기 시작일, 시작일 이전이면 ''
export function toCycleStartDate(cycle: string, date: string, anchor?: WorkCycleAnchor): string {
    const value = dayjs(date);
    if (!date || !value.isValid()) {
        return date;
    }
    if (anchor) {
        if (date < anchor.startDate) {
            return '';
        }
        return hasCycleBoundary(cycle) ? boundary(cycle, anchor, cycleIndex(cycle, anchor, date)) : date;
    }
    if (cycle === 'WEEK') {
        return value.subtract((value.day() + 6) % 7, 'day').format(FORMAT);
    }
    if (cycle === 'MONTH') {
        return value.startOf('month').format(FORMAT);
    }
    if (cycle === 'YEAR') {
        return value.startOf('year').format(FORMAT);
    }
    if (cycle === 'QUARTER') {
        return value.month(Math.floor(value.month() / 3) * 3).startOf('month').format(FORMAT);
    }
    if (cycle === 'HALF') {
        return value.month(value.month() < 6 ? 0 : 6).startOf('month').format(FORMAT);
    }
    return date;
}

// date 가 속한 주기의 다음 주기 시작일 (주기 끝 = 이 값 - 1일). 기준이 있고 시작일 이전이면 ''
export function nextCycleStart(cycle: string, date: string, anchor?: WorkCycleAnchor): string {
    if (anchor) {
        if (date < anchor.startDate) {
            return '';
        }
        return hasCycleBoundary(cycle)
            ? boundary(cycle, anchor, cycleIndex(cycle, anchor, date) + 1)
            : dayjs(date).add(1, 'day').format(FORMAT);
    }
    const start = dayjs(toCycleStartDate(cycle, date));
    if (cycle === 'WEEK') {
        return start.add(7, 'day').format(FORMAT);
    }
    const months = CYCLE_MONTHS[cycle];
    return (months ? start.add(months, 'month') : start.add(1, 'day')).format(FORMAT);
}

// 업무 응답의 시작일 필드를 기준으로. 시작일이 없으면 undefined (기존 달력 기준)
export function toWorkCycleAnchor(work: {
    workStartDate?: string;
    cycleAnchorType?: string;
    cycleAnchorWeek?: number | null;
    cycleAnchorWeekday?: number | null;
}): WorkCycleAnchor | undefined {
    if (!work.workStartDate) {
        return undefined;
    }
    const byWeekday = work.cycleAnchorType === 'WEEKDAY';
    return {
        startDate: work.workStartDate,
        type: byWeekday ? 'WEEKDAY' : 'DATE',
        week: byWeekday ? work.cycleAnchorWeek ?? null : null,
        weekday: byWeekday ? work.cycleAnchorWeekday ?? null : null,
    };
}

// 양식관리 미리보기 문구. 예) 매월 3째주 화요일, 첫 주기 2026-04-14 ~ 2026-05-18
export function describeCycleAnchor(cycle: string, anchor: WorkCycleAnchor): string {
    const prefix = CYCLE_PREFIX[cycle];
    if (!prefix) {
        return `${anchor.startDate}부터 작성`;
    }
    const start = dayjs(anchor.startDate);
    let rule: string;
    if (cycle === 'WEEK') {
        rule = `${WEEKDAY_NAMES[isoWeekday(start) - 1]}요일`;
    } else if (anchor.type === 'WEEKDAY') {
        const weekLabel = anchor.week === LAST_WEEK ? '마지막 주' : `${anchor.week}째주`;
        rule = `${weekLabel} ${WEEKDAY_NAMES[(anchor.weekday ?? 1) - 1]}요일`;
    } else {
        rule = `${start.date()}일`;
    }
    const month = cycle === 'YEAR'
        ? `${dayjs(anchor.type === 'WEEKDAY' ? anchorMonthOf(anchor.startDate) : anchor.startDate).month() + 1}월 `
        : '';
    const end = dayjs(nextCycleStart(cycle, anchor.startDate, anchor)).subtract(1, 'day').format(FORMAT);
    return `${prefix} ${month}${rule}, 첫 주기 ${anchor.startDate} ~ ${end}`;
}