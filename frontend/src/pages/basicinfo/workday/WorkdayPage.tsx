import { Alert, Button, Paper, Stack } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { PageHeader } from '../../../shared/components/layout/PageHeader';
import { useAuthStore } from '../../../shared/store/authStore';
import { extractApiErrorMessage } from '../../../services/api/errorMessage';
import {
    generateWorkdays,
    listWorkdays,
    saveWorkdays,
    type WorkdayItem,
} from '../../../services/basicinfo/workday/workdayService';
import { WorkdayCalendar } from './components/WorkdayCalendar';
import { WorkdayEditDialog } from './components/WorkdayEditDialog';
import {
    WorkdayGenerateDialog,
    type WorkdayGenerateValue,
} from './components/WorkdayGenerateDialog';
import { WorkdaySidePanel } from './components/WorkdaySidePanel';
import { applyChanges } from './workdayRules';

export function WorkdayPage() {
    const queryClient = useQueryClient();
    const tenantCode = useAuthStore((state) => state.tenantCode);
    const [viewDate, setViewDate] = useState(() => new Date());
    // key: YYYY-MM-DD. 연도를 넘나들어도 날짜 key 라 섞이지 않음
    const [changes, setChanges] = useState<Record<string, WorkdayItem>>({});
    const [editingDate, setEditingDate] = useState<string | null>(null);
    const [generateOpen, setGenerateOpen] = useState(false);

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth() + 1;

    const workdayQuery = useQuery({
        queryKey: ['basicinfo-workday', tenantCode || 'self', year],
        queryFn: () => listWorkdays({ tenantCode: tenantCode || undefined, year }),
    });

    const serverItems = workdayQuery.data ?? [];
    const items = useMemo(() => applyChanges(serverItems, changes), [serverItems, changes]);
    const changedDates = useMemo(() => new Set(Object.keys(changes)), [changes]);
    const hasYearChanges = Object.keys(changes).some((date) => date.startsWith(`${year}-`));
    const editingItem = editingDate
        ? items.find((item) => item.workdayDate === editingDate) ?? null
        : null;

    const saveMutation = useMutation({
        mutationFn: () =>
            saveWorkdays({ tenantCode: tenantCode || undefined, items: Object.values(changes) }),
        onSuccess: async () => {
            setChanges({});
            await queryClient.invalidateQueries({ queryKey: ['basicinfo-workday'] });
        },
    });

    const generateMutation = useMutation({
        mutationFn: (value: WorkdayGenerateValue) =>
            generateWorkdays({
                tenantCode: tenantCode || undefined,
                year,
                ...value,
                overwrite: serverItems.length > 0,
            }),
        onSuccess: async () => {
            setChanges((current) =>
                Object.fromEntries(
                    Object.entries(current).filter(([date]) => !date.startsWith(`${year}-`)),
                ),
            );
            setGenerateOpen(false);
            await queryClient.invalidateQueries({ queryKey: ['basicinfo-workday'] });
        },
    });

    const handleSelectDate = (workdayDate: string) => {
        // 생성 안 된 연도나 다른 연도 날짜(달력 앞뒤 칸)는 무시
        if (items.some((item) => item.workdayDate === workdayDate)) {
            setEditingDate(workdayDate);
        }
    };

    const handleEditSubmit = (item: WorkdayItem) => {
        setChanges((current) => ({ ...current, [item.workdayDate]: item }));
        setEditingDate(null);
    };

    return (
        <Stack spacing={2} data-testid="basicinfo-workday-page">
            <PageHeader
                groupLabel="기준정보 관리"
                title="업무일 관리"
                description="휴무일과 영업일을 지정합니다."
            />

            <Stack direction="row" spacing={1} justifyContent="flex-end">
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

            {workdayQuery.isError ? (
                <Alert severity="warning">업무일을 불러오지 못했습니다.</Alert>
            ) : null}
            {saveMutation.isError ? (
                <Alert severity="error">
                    {extractApiErrorMessage(saveMutation.error, '업무일을 저장하지 못했습니다.')}
                </Alert>
            ) : null}
            {workdayQuery.isSuccess && serverItems.length === 0 ? (
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

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
                <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, p: 2, width: '100%' }}>
                    <WorkdayCalendar
                        items={items}
                        changedDates={changedDates}
                        viewDate={viewDate}
                        onNavigate={setViewDate}
                        onSelectDate={handleSelectDate}
                    />
                </Paper>
                <WorkdaySidePanel year={year} month={month} items={items} onSelectDate={handleSelectDate} />
            </Stack>

            {editingItem ? (
                <WorkdayEditDialog
                    key={editingItem.workdayDate}
                    item={editingItem}
                    onClose={() => setEditingDate(null)}
                    onSubmit={handleEditSubmit}
                />
            ) : null}

            {generateOpen ? (
                <WorkdayGenerateDialog
                    year={year}
                    hasExistingData={serverItems.length > 0}
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