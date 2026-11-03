import { Box } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { koKR } from '@mui/x-data-grid/locales';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import type { WeekItem, WorkdayItem } from '../../../../services/basicinfo/workday/workdayService';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import { useCommonCodeOptions } from '../../../../shared/hooks/useCommonCodeOptions';
import { centerColumns, COMMON_CODE_GRID_SX } from '../../common-code/components/gridStyles';
import { dayColor, findWeek } from '../workdayRules';

dayjs.locale('ko');

type WorkdayListTableProps = {
    items: WorkdayItem[];
    changedDates: Set<string>;
    weeks: WeekItem[];
    onChangeRow: (oldRow: WorkdayItem, newRow: WorkdayItem) => void;
};

export function WorkdayListTable({ items, changedDates, weeks, onChangeRow }: WorkdayListTableProps) {
    const typeOptions = useCommonCodeOptions(COMMON_CODE_GROUP.WORKDAY_TYPE);
    // 조회 전이거나 미사용 처리된 현재 값도 셀렉트에 보이도록 덧붙임
    const missingCodes = [...new Set(items.map((item) => item.dayType))].filter(
        (code) => !typeOptions.some((option) => option.code === code),
    );
    const valueOptions = [
        ...typeOptions.map((option) => ({ value: option.code, label: option.name })),
        ...missingCodes.map((code) => ({ value: code, label: code })),
    ];
    const redDayClass = (row: WorkdayItem) => {
        const color = dayColor(row.workdayDate, row.dayType);
        return color ? `cell-${color}-day` : '';
    };

    const columns: GridColDef<WorkdayItem>[] = centerColumns<WorkdayItem>([
        {
            field: 'week',
            headerName: '주차',
            width: 80,
            sortable: false,
            valueGetter: (_value, row) => {
                const week = findWeek(weeks, row.workdayDate);
                return week ? `W${week.week}` : '';
            },
        },
        { field: 'workdayDate', headerName: '날짜', width: 130, cellClassName: (params) => redDayClass(params.row) },
        {
            field: 'weekday',
            headerName: '요일',
            width: 80,
            sortable: false,
            valueGetter: (_value, row) => dayjs(row.workdayDate).format('dd'),
            cellClassName: (params) => redDayClass(params.row),
        },
        {
            field: 'dayType',
            headerName: '휴무일 구분',
            type: 'singleSelect',
            editable: true,
            width: 160,
            valueOptions,
        },
        { field: 'dayName', headerName: '휴일명', minWidth: 140, flex: 1 },
        // 기존 -> { field: 'memo', headerName: '메모', minWidth: 180, flex: 2 },
        // 변경 -> 메모 셀 편집 가능
        { field: 'memo', headerName: '메모', minWidth: 180, flex: 2, editable: true },
    ]);

    // 기존 -> if (newRow.dayType !== oldRow.dayType) onChangeType(oldRow, newRow.dayType);
    // 변경 -> 메모 변경도 감지, 메모는 앞뒤 공백 제거
    const processRowUpdate = (newRow: WorkdayItem, oldRow: WorkdayItem) => {
        const row = { ...newRow, memo: (newRow.memo ?? '').trim() };
        if (row.dayType !== oldRow.dayType || row.memo !== oldRow.memo) onChangeRow(oldRow, row);
        return row;
    };

    return (
        <Box sx={{ height: 560 }}>
            <DataGrid
                rows={items}
                columns={columns}
                getRowId={(row) => row.workdayDate}
                density="compact"
                editMode="cell"
                processRowUpdate={processRowUpdate}
                // 휴무일 구분 셀은 한 번 클릭으로 바로 셀렉트 열기
                onCellClick={(params) => {
                    if (params.isEditable && params.cellMode === 'view') {
                        params.api.startCellEditMode({ id: params.id, field: params.field });
                    }
                }}
                disableRowSelectionOnClick
                // 기존 -> hideFooter (MIT DataGrid 는 페이지당 100행 제한이라 100일 이후가 안 보임)
                // 변경 -> footer 표시로 페이지 이동 가능
                localeText={{
                    ...koKR.components.MuiDataGrid.defaultProps.localeText,
                    noRowsLabel: '조회된 업무일이 없습니다.',
                }}
                getRowClassName={(params) => (changedDates.has(params.row.workdayDate) ? 'row-modified' : '')}
                // 기존 -> sx={{ ...COMMON_CODE_GRID_SX, '& .cell-red-day': { color: 'error.main' } }}
                // 변경 -> 토요일 파랑 클래스 추가
                sx={{
                    ...COMMON_CODE_GRID_SX,
                    '& .cell-red-day': { color: 'error.main' },
                    '& .cell-blue-day': { color: 'primary.main' },
                }}
            />
        </Box>
    );
}