import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import { Box, Button, Paper, Stack, Typography } from '@mui/material';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { koKR } from '@mui/x-data-grid/locales';
import { markEdited } from '../commonCodeRows';
import type { CommonCodeGroupRow } from '../types';
import { centerColumns, COMMON_CODE_GRID_SX, TOOLBAR_BUTTON_SX } from './gridStyles';

const EDITABLE_FIELDS = ['groupCode', 'groupName', 'groupDesc'] as const;

// 기존 -> const COLUMNS: GridColDef<CommonCodeGroupRow>[] = [ ... ];  (컬럼별 기본 정렬)
// 변경 -> 모든 컬럼 헤더/데이터 가운데 정렬
const COLUMNS: GridColDef<CommonCodeGroupRow>[] = centerColumns<CommonCodeGroupRow>([
    { field: 'groupName', headerName: '그룹명 *', editable: true, flex: 1, minWidth: 120 },
    { field: 'groupCode', headerName: '그룹코드 *', editable: true, flex: 1.2, minWidth: 150 },
    { field: 'groupDesc', headerName: '그룹 설명', editable: true, flex: 1.6, minWidth: 160 },
]);

// 기존 -> props: rows, selectedId, onSelect, onRowUpdate, onAdd, onDelete (모든 사용자 편집 가능)
// 변경 -> canManage(플랫폼관리자)일 때만 추가/삭제/저장 버튼과 셀 편집 허용
export function CommonCodeGroupGrid(props: {
    rows: CommonCodeGroupRow[];
    selectedId: string | null;
    canManage: boolean;
    saveDisabled: boolean;
    onSelect: (id: string) => void;
    onRowUpdate: (row: CommonCodeGroupRow) => void;
    onAdd: () => void;
    onDelete: () => void;
    onSave: () => void;
}) {
    const { rows, selectedId, canManage, saveDisabled, onSelect, onRowUpdate, onAdd, onDelete, onSave } = props;

    const processRowUpdate = (newRow: CommonCodeGroupRow, oldRow: CommonCodeGroupRow) => {
        const updated = markEdited(newRow, oldRow, EDITABLE_FIELDS);
        if (updated !== oldRow) onRowUpdate(updated);
        return updated;
    };

    return (
        <Paper variant="outlined" sx={{ height: '100%', p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" fontWeight={700}>
                    공통코드 그룹 관리
                </Typography>
                {canManage ? (
                    <Stack direction="row" spacing={1}>
                        <Button size="small" variant="outlined" sx={TOOLBAR_BUTTON_SX} startIcon={<AddRoundedIcon />} aria-label="그룹 추가" onClick={onAdd}>
                            추가
                        </Button>
                        <Button size="small" variant="outlined" color="error" sx={TOOLBAR_BUTTON_SX} startIcon={<DeleteOutlineRoundedIcon />} aria-label="그룹 삭제" onClick={onDelete}>
                            삭제
                        </Button>
                        <Button size="small" variant="outlined" sx={TOOLBAR_BUTTON_SX} startIcon={<SaveOutlinedIcon />} aria-label="그룹 저장" disabled={saveDisabled} onClick={onSave}>
                            저장
                        </Button>
                    </Stack>
                ) : null}
            </Stack>
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <DataGrid
                    rows={rows}
                    columns={COLUMNS}
                    editMode="cell"
                    processRowUpdate={processRowUpdate}
                    isCellEditable={(params) =>
                        canManage && (params.field !== 'groupCode' || params.row.rowState === 'new')
                    }
                    onRowClick={(params) => onSelect(String(params.id))}
                    disableRowSelectionOnClick
                    // ponytail: 공통코드 그룹은 수십 건 수준이라 가상화/페이지 불필요, jsdom 테스트에서도 행이 렌더됨
                    disableVirtualization
                    hideFooter
                    localeText={koKR.components.MuiDataGrid.defaultProps.localeText}
                    getRowClassName={(params) =>
                        [
                            params.row.rowState === 'saved' ? '' : `row-${params.row.rowState}`,
                            params.id === selectedId ? 'row-current' : '',
                        ].join(' ')
                    }
                    sx={COMMON_CODE_GRID_SX}
                />
            </Box>
        </Paper>
    );
}