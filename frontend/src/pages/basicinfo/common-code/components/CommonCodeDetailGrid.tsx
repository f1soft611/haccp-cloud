import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Box, Button, Checkbox, Paper, Stack, Typography } from '@mui/material';
import { DataGrid, useGridApiRef, type GridColDef } from '@mui/x-data-grid';
import { koKR } from '@mui/x-data-grid/locales';
import { markEdited } from '../commonCodeRows';
import type { CommonCodeDetailRow } from '../types';
import { centerColumns, COMMON_CODE_GRID_SX, TOOLBAR_BUTTON_SX } from './gridStyles';

const EDITABLE_FIELDS = ['code', 'codeName', 'useAt', 'sortOrder', 'codeDesc'] as const;

export function CommonCodeDetailGrid(props: {
    rows: CommonCodeDetailRow[];
    groupName: string | null;
    onRowUpdate: (row: CommonCodeDetailRow) => void;
    onToggleAllUse: (useAt: boolean) => void;
    onAdd: () => void;
    onDelete: (ids: string[]) => void;
}) {
    const { rows, groupName, onRowUpdate, onToggleAllUse, onAdd, onDelete } = props;
    const apiRef = useGridApiRef();
    const allUsed = rows.length > 0 && rows.every((row) => row.useAt);

    // 기존 -> const columns: GridColDef<CommonCodeDetailRow>[] = [ ... ];  (컬럼별 기본 정렬)
    // 변경 -> 모든 컬럼 헤더/데이터 가운데 정렬
    const columns: GridColDef<CommonCodeDetailRow>[] = centerColumns<CommonCodeDetailRow>([
        {
            field: 'seq',
            headerName: '순번',
            width: 70,
            sortable: false,
            align: 'center',
            headerAlign: 'center',
            renderCell: (params) => params.api.getRowIndexRelativeToVisibleRows(params.id) + 1,
        },
        { field: 'code', headerName: '상세코드 *', editable: true, minWidth: 120, flex: 1 },
        { field: 'codeName', headerName: '상세코드명 *', editable: true, minWidth: 140, flex: 1.4 },
        { field: 'parentCodeName', headerName: '상위코드명', minWidth: 120, flex: 1 },
        {
            field: 'useAt',
            headerName: '사용여부',
            type: 'boolean',
            editable: true,
            width: 110,
            sortable: false,
            disableColumnMenu: true,
            renderHeader: () => (
                <Stack direction="row" alignItems="center">
                    <Checkbox
                        size="small"
                        checked={allUsed}
                        indeterminate={!allUsed && rows.some((row) => row.useAt)}
                        disabled={rows.length === 0}
                        onClick={(event) => event.stopPropagation()}
                        onChange={(event) => onToggleAllUse(event.target.checked)}
                        inputProps={{ 'aria-label': '사용여부 전체' }}
                    />
                    사용여부
                </Stack>
            ),
        },
        { field: 'sortOrder', headerName: '정렬순서', type: 'number', editable: true, width: 100 },
        { field: 'codeDesc', headerName: '설명', editable: true, minWidth: 180, flex: 2 },
    ]);

    const processRowUpdate = (newRow: CommonCodeDetailRow, oldRow: CommonCodeDetailRow) => {
        const updated = markEdited(newRow, oldRow, EDITABLE_FIELDS);
        if (updated !== oldRow) onRowUpdate(updated);
        return updated;
    };

    const handleDelete = () => {
        const selected = apiRef.current?.getSelectedRows() ?? new Map();
        onDelete(Array.from(selected.keys(), String));
    };

    return (
        <Paper variant="outlined" sx={{ height: '100%', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="subtitle2" fontWeight={700}>
                    공통코드 상세 관리
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                    {groupName !== null ? (
                        <Typography variant="body2" color="text.secondary">
                            {`선택 그룹: ${groupName || '(그룹명 없음)'}`}
                        </Typography>
                    ) : null}
                    <Button size="small" variant="outlined" sx={TOOLBAR_BUTTON_SX} startIcon={<AddRoundedIcon />} aria-label="상세 추가" onClick={onAdd}>
                        추가
                    </Button>
                    <Button size="small" variant="outlined" color="error" sx={TOOLBAR_BUTTON_SX} startIcon={<DeleteOutlineRoundedIcon />} aria-label="상세 삭제" onClick={handleDelete}>
                        삭제
                    </Button>
                </Stack>
            </Stack>
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <DataGrid
                    apiRef={apiRef}
                    rows={rows}
                    columns={columns}
                    editMode="cell"
                    processRowUpdate={processRowUpdate}
                    isCellEditable={(params) => params.field !== 'code' || params.row.rowState === 'new'}
                    checkboxSelection
                    disableRowSelectionOnClick
                    // ponytail: 그룹당 상세 수십 건 수준이라 가상화/페이지 불필요, jsdom 테스트에서도 행이 렌더됨
                    disableVirtualization
                    hideFooter
                    initialState={{ sorting: { sortModel: [{ field: 'sortOrder', sort: 'asc' }] } }}
                    localeText={koKR.components.MuiDataGrid.defaultProps.localeText}
                    getRowClassName={(params) => (params.row.rowState === 'saved' ? '' : `row-${params.row.rowState}`)}
                    sx={COMMON_CODE_GRID_SX}
                />
            </Box>
        </Paper>
    );
}