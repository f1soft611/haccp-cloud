import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { Box, Button, Stack } from '@mui/material';
import { DataGrid, useGridApiRef, type GridColDef } from '@mui/x-data-grid';
import { koKR } from '@mui/x-data-grid/locales';
import type { WorkOrderRow, WorkOrderRowState } from '../types';

const TOOLBAR_BUTTON_SX = { borderRadius: 999 };

const EDITABLE_FIELDS = [
    'itemName',
    'productionDate',
    'expiryDate',
    'quantity',
    'unit',
    'spec',
    'remark',
] as const;

function formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// 행 데이터는 YYYY-MM-DD 문자열, DataGrid date 컬럼은 Date 객체를 다룬다.
function dateColumn(field: 'productionDate' | 'expiryDate', headerName: string): GridColDef<WorkOrderRow> {
    return {
        field,
        headerName,
        type: 'date',
        editable: true,
        minWidth: 140,
        valueGetter: (value: string) => (value ? new Date(`${value}T00:00:00`) : null),
        valueSetter: (value: Date | null, row) => ({
            ...row,
            [field]: value ? formatDate(value) : '',
        }),
        valueFormatter: (value: Date | null) => (value ? formatDate(value) : ''),
    };
}

const COLUMNS: GridColDef<WorkOrderRow>[] = ([
    { field: 'itemName', headerName: '품명', editable: true, flex: 1.2, minWidth: 160 },
    dateColumn('productionDate', '생산일자'),
    dateColumn('expiryDate', '소비기한'),
    { field: 'quantity', headerName: '생산량', type: 'number', editable: true, minWidth: 100 },
    { field: 'unit', headerName: '단위', editable: true, minWidth: 80 },
    { field: 'spec', headerName: '규격', editable: true, minWidth: 120 },
    { field: 'remark', headerName: '비고', editable: true, flex: 1.5, minWidth: 180 },
// 기존 -> ];  (컬럼별 기본 정렬)
// 변경 -> 모든 컬럼 헤더/데이터 가운데 정렬
] as GridColDef<WorkOrderRow>[]).map((column) => ({ ...column, align: 'center', headerAlign: 'center' }));

export function WorkOrderGrid(props: {
    rows: WorkOrderRow[];
    onRowUpdate: (row: WorkOrderRow) => void;
    onAdd: () => void;
    onSave: () => void;
    onRequestApproval: () => void;
    onDelete: (ids: string[]) => void;
}) {
    const { rows, onRowUpdate, onAdd, onSave, onRequestApproval, onDelete } = props;
    const apiRef = useGridApiRef();

    const handleExport = () => {
        apiRef.current?.exportDataAsCsv({
            fileName: `작업지시_${formatDate(new Date()).replace(/-/g, '')}`,
            utf8WithBom: true,
        });
    };

    const handleDelete = () => {
        const selected = apiRef.current?.getSelectedRows() ?? new Map();
        onDelete(Array.from(selected.keys(), String));
    };

    const processRowUpdate = (newRow: WorkOrderRow, oldRow: WorkOrderRow) => {
        const changed = EDITABLE_FIELDS.some((field) => newRow[field] !== oldRow[field]);
        if (!changed) return oldRow;
        const rowState: WorkOrderRowState = oldRow.rowState === 'new' ? 'new' : 'modified';
        const updated = { ...newRow, rowState };
        onRowUpdate(updated);
        return updated;
    };

    return (
        <Stack spacing={1}>
            <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
                <Button size="small" variant="outlined" sx={TOOLBAR_BUTTON_SX} startIcon={<AddRoundedIcon />} onClick={onAdd}>
                    신규
                </Button>
                <Button size="small" variant="outlined" sx={TOOLBAR_BUTTON_SX} startIcon={<FileDownloadOutlinedIcon />} onClick={handleExport}>
                    엑셀
                </Button>
                <Button size="small" variant="outlined" sx={TOOLBAR_BUTTON_SX} startIcon={<SaveOutlinedIcon />} onClick={onSave}>
                    저장
                </Button>
                <Button size="small" variant="outlined" sx={TOOLBAR_BUTTON_SX} startIcon={<SendOutlinedIcon />} onClick={onRequestApproval}>
                    결재요청
                </Button>
                <Button size="small" variant="outlined" color="error" sx={TOOLBAR_BUTTON_SX} startIcon={<DeleteOutlineRoundedIcon />} onClick={handleDelete}>
                    삭제
                </Button>
            </Stack>

            <Box sx={{ height: 600 }}>
                <DataGrid
                    apiRef={apiRef}
                    rows={rows}
                    columns={COLUMNS}
                    editMode="cell"
                    processRowUpdate={processRowUpdate}
                    checkboxSelection
                    disableRowSelectionOnClick
                    // ponytail: 행 수가 적어 가상화 불필요, jsdom 테스트에서도 행이 렌더됨. 대량 데이터면 제거
                    disableVirtualization
                    pageSizeOptions={[10, 20, 50, 100]}
                    initialState={{ pagination: { paginationModel: { pageSize: 20 } } }}
                    localeText={koKR.components.MuiDataGrid.defaultProps.localeText}
                    getRowClassName={(params) =>
                        params.row.rowState === 'saved' ? '' : `row-${params.row.rowState}`
                    }
                    sx={{
                        bgcolor: '#fff',
                        '& .MuiDataGrid-columnHeader': {
                            bgcolor: '#d7ecea',
                            color: '#2f5f5b',
                            fontWeight: 700,
                        },
                        '& .row-new': { bgcolor: 'rgba(46, 125, 50, 0.08)' },
                        '& .row-modified': { bgcolor: 'rgba(237, 108, 2, 0.08)' },
                    }}
                />
            </Box>
        </Stack>
    );
}