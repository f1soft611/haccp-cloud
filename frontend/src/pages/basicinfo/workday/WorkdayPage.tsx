import { Alert, Box, Button, Paper, Stack, TextField } from '@mui/material';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useAuthStore } from '../../../shared/store/authStore';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import {
    generateWorkdays,
    listWorkdays,
    listWeeks,
    saveWorkdays,
    type WorkdayItem,
} from '../../../services/basicinfo/workday/workdayService';
import {
    WorkdayGenerateDialog,
    type WorkdayGenerateValue,
} from './components/WorkdayGenerateDialog';
import { WorkdayListTable } from './components/WorkdayListTable';
import { applyChanges, currentMonthRange, filterByRange, yearsInRange } from './workdayRules';

export function WorkdayPage() {
    const queryClient = useQueryClient();
    const tenantCode = useAuthStore((state) => state.tenantCode);
    const [draftRange, setDraftRange] = useState(() => currentMonthRange(new Date()));
    const [range, setRange] = useState(draftRange);
    // key: YYYY-MM-DD. 연도를 넘나들어도 날짜 key 라 섞이지 않음
    const [changes, setChanges] = useState<Record<string, WorkdayItem>>({});
    const [generateOpen, setGenerateOpen] = useState(false);

    const year = Number(range.start.slice(0, 4));
    const years = yearsInRange(range.start, range.end);

    const workdayQueries = useQueries({
        queries: years.map((queryYear) => ({
            queryKey: ['basicinfo-workday', tenantCode || 'self', queryYear],
            queryFn: () => listWorkdays({ tenantCode: tenantCode || undefined, year: queryYear }),
        })),
    });
    // 주차는 부가 정보: 실패해도 알림 없이 주차 칸만 비움
    const weekQuery = useQuery({
        queryKey: ['basicinfo-week', tenantCode || 'self', range.start, range.end],
        queryFn: () => listWeeks({ tenantCode: tenantCode || undefined, from: range.start, to: range.end }),
    });
    const isError = workdayQueries.some((query) => query.isError);
    const isSuccess = workdayQueries.length > 0 && workdayQueries.every((query) => query.isSuccess);
    // ponytail: useQueries 결과 배열은 렌더마다 새로 생겨 memo 효과가 없음, 365행 이하라 매번 계산
    const serverItems = workdayQueries.flatMap((query) => query.data ?? []);
    const startYearItemCount = workdayQueries[0]?.data?.length ?? 0;
    const items = filterByRange(applyChanges(serverItems, changes), range.start, range.end);
    const changedDates = useMemo(() => new Set(Object.keys(changes)), [changes]);
    const hasYearChanges = Object.keys(changes).some((date) => date.startsWith(`${year}-`));

    const saveMutation = useMutation({
        mutationFn: () =>
            saveWorkdays({ tenantCode: tenantCode || undefined, items: Object.values(changes) }),
        onSuccess: async () => {
            setChanges({});
            await queryClient.invalidateQueries({ queryKey: ['basicinfo-workday'] });
            await queryClient.invalidateQueries({ queryKey: ['basicinfo-week'] });
        },
    });

    const generateMutation = useMutation({
        mutationFn: (value: WorkdayGenerateValue) =>
            generateWorkdays({
                tenantCode: tenantCode || undefined,
                year,
                ...value,
                overwrite: startYearItemCount > 0,
            }),
        onSuccess: async () => {
            setChanges((current) =>
                Object.fromEntries(
                    Object.entries(current).filter(([date]) => !date.startsWith(`${year}-`)),
                ),
            );
            setGenerateOpen(false);
            await queryClient.invalidateQueries({ queryKey: ['basicinfo-workday'] });
            await queryClient.invalidateQueries({ queryKey: ['basicinfo-week'] });
        },
    });

    // 기존 -> handleChangeType: 휴무일 구분만 반영하고 항상 source 를 MANUAL 로 바꿈
    // 변경 -> 메모도 반영, source 는 휴무일 구분이 바뀔 때만 MANUAL
    const handleChangeRow = (oldRow: WorkdayItem, newRow: WorkdayItem) => {
        const source = newRow.dayType !== oldRow.dayType ? 'MANUAL' : oldRow.source;
        setChanges((current) => ({ ...current, [oldRow.workdayDate]: { ...newRow, source } }));
    };

    return (
        <Stack spacing={2} data-testid="basicinfo-workday-page">
            <PageHeader
                groupLabel="기준정보 관리"
                title="업무일 관리"
                description="휴무일과 영업일을 지정합니다."
            />

            <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                    <TextField
                        type="date"
                        size="small"
                        label="시작일"
                        value={draftRange.start}
                        onChange={(event) => setDraftRange((current) => ({ ...current, start: event.target.value }))}
                        InputLabelProps={{ shrink: true }}
                    />
                    <span>~</span>
                    <TextField
                        type="date"
                        size="small"
                        label="종료일"
                        value={draftRange.end}
                        onChange={(event) => setDraftRange((current) => ({ ...current, end: event.target.value }))}
                        InputLabelProps={{ shrink: true }}
                    />
                    <Button
                        variant="contained"
                        disabled={!draftRange.start || !draftRange.end || draftRange.start > draftRange.end}
                        onClick={() => setRange(draftRange)}
                    >
                        조회
                    </Button>
                    {/* 기존 -> 생성/저장 버튼이 검색필터 아래 별도 Stack 에 있음 */}
                    {/* 변경 -> 검색필터 안 오른쪽 끝으로 이동 */}
                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant="outlined" onClick={() => setGenerateOpen(true)}>
                        업무일 생성
                    </Button>
                    <Button
                        variant="contained"
                        disabled={changedDates.size === 0 || saveMutation.isPending}
                        onClick={() => saveMutation.mutate()}
                    >
                        저장
                    </Button>
                </Stack>
            </Paper>

            {isError ? (
                <Alert severity="warning">업무일을 불러오지 못했습니다.</Alert>
            ) : null}
            {saveMutation.isError ? (
                <Alert severity="error">
                    {extractApiErrorMessage(saveMutation.error, '업무일을 저장하지 못했습니다.')}
                </Alert>
            ) : null}
            {isSuccess && startYearItemCount === 0 ? (
                <Alert
                    severity="info"
                    action={
                        <Button color="inherit" size="small" onClick={() => setGenerateOpen(true)}>
                            {year}년 업무일 생성
                        </Button>
                    }
                >
                    {year}년 업무일이 아직 없습니다.
                </Alert>
            ) : null}

            <Paper variant="outlined">
                <WorkdayListTable
                    items={items}
                    changedDates={changedDates}
                    weeks={weekQuery.data ?? []}
                    onChangeRow={handleChangeRow}
                />
            </Paper>

            {generateOpen ? (
                <WorkdayGenerateDialog
                    year={year}
                    hasExistingData={startYearItemCount > 0}
                    hasUnsavedChanges={hasYearChanges}
                    loading={generateMutation.isPending}
                    errorMessage={
                        generateMutation.isError
                            ? extractApiErrorMessage(generateMutation.error, '업무일을 생성하지 못했습니다.')
                            : undefined
                    }
                    onClose={() => {
                        generateMutation.reset();
                        setGenerateOpen(false);
                    }}
                    onSubmit={(value) => generateMutation.mutate(value)}
                />
            ) : null}
        </Stack>
    );
}