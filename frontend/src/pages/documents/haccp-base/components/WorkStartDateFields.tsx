import { Stack, Typography } from '@mui/material';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import {
    describeCycleAnchor,
    isMonthlyOrLongerCycle,
    LAST_WEEK,
    monthWeekDate,
    type WorkCycleAnchor,
} from '../../../../shared/utils/workCycleDates';
import type { HaccpBaseCreateForm } from '../types';

const ANCHOR_TYPE_OPTIONS = [
    { value: 'DATE', label: '일자 기준' },
    { value: 'WEEKDAY', label: '주차 기준' },
] as const;

const WEEK_OPTIONS = [
    { value: '1', label: '1째주' },
    { value: '2', label: '2째주' },
    { value: '3', label: '3째주' },
    { value: '4', label: '4째주' },
    { value: String(LAST_WEEK), label: '마지막 주' },
] as const;

const WEEKDAY_OPTIONS = ['월', '화', '수', '목', '금', '토', '일'].map((name, index) => ({
    value: String(index + 1),
    label: `${name}요일`,
}));

// 작성주기를 바꿔 주차 기준을 못 쓰게 되면 함께 비우는 값
export const WEEKDAY_ANCHOR_RESET = {
    cycleAnchorType: 'DATE',
    workStartMonth: '',
    cycleAnchorWeek: '',
    cycleAnchorWeekday: '',
} as const;

// 폼 입력으로 만든 주기 기준. 입력이 덜 됐으면 undefined
export function toFormCycleAnchor(form: HaccpBaseCreateForm): WorkCycleAnchor | undefined {
    if (form.cycleAnchorType === 'WEEKDAY') {
        if (!form.workStartMonth || !form.cycleAnchorWeek || !form.cycleAnchorWeekday) {
            return undefined;
        }
        const week = Number(form.cycleAnchorWeek);
        const weekday = Number(form.cycleAnchorWeekday);
        return { startDate: monthWeekDate(`${form.workStartMonth}-01`, week, weekday), type: 'WEEKDAY', week, weekday };
    }
    return form.workStartDate ? { startDate: form.workStartDate, type: 'DATE', week: null, weekday: null } : undefined;
}

// 주차 기준인데 연월, 주차, 요일 중 하나라도 비었으면 저장 불가
export function isWorkStartIncomplete(form: HaccpBaseCreateForm): boolean {
    return form.cycleAnchorType === 'WEEKDAY' && !toFormCycleAnchor(form);
}

// 양식관리 업무 시작일 입력. 월 이상 주기만 주차 기준을 고를 수 있다
export function WorkStartDateFields(props: {
    value: HaccpBaseCreateForm;
    onChange: (next: HaccpBaseCreateForm) => void;
}) {
    const { value, onChange } = props;
    const canUseWeekday = isMonthlyOrLongerCycle(value.cycle);
    const byWeekday = canUseWeekday && value.cycleAnchorType === 'WEEKDAY';
    const anchor = toFormCycleAnchor(value);

    return (
        <Stack spacing={1}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {canUseWeekday && (
                    <AppSelect
                        fullWidth
                        label="시작일 기준"
                        value={value.cycleAnchorType}
                        onChange={(cycleAnchorType) => onChange({ ...value, cycleAnchorType })}
                        options={ANCHOR_TYPE_OPTIONS}
                    />
                )}
                {byWeekday ? (
                    <>
                        <AppTextField
                            fullWidth
                            type="month"
                            label="시작 연월"
                            value={value.workStartMonth}
                            onChange={(workStartMonth) => onChange({ ...value, workStartMonth })}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                        <AppSelect
                            fullWidth
                            label="주차"
                            value={value.cycleAnchorWeek}
                            onChange={(cycleAnchorWeek) => onChange({ ...value, cycleAnchorWeek })}
                            options={WEEK_OPTIONS}
                        />
                        <AppSelect
                            fullWidth
                            label="요일"
                            value={value.cycleAnchorWeekday}
                            onChange={(cycleAnchorWeekday) => onChange({ ...value, cycleAnchorWeekday })}
                            options={WEEKDAY_OPTIONS}
                        />
                    </>
                ) : (
                    <AppTextField
                        fullWidth
                        type="date"
                        label="업무 시작일"
                        value={value.workStartDate}
                        onChange={(workStartDate) => onChange({ ...value, workStartDate })}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
                {anchor
                    ? describeCycleAnchor(value.cycle, anchor)
                    : '비우면 달력 기준(매주 월요일, 매월 1일 등)으로 주기가 나뉩니다.'}
            </Typography>
        </Stack>
    );
}