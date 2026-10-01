import type { GridColDef, GridValidRowModel } from '@mui/x-data-grid';

export const TOOLBAR_BUTTON_SX = { borderRadius: 999 };

export const COMMON_CODE_GRID_SX = {
    bgcolor: '#fff',
    '& .MuiDataGrid-columnHeader': {
        bgcolor: '#d7ecea',
        color: '#2f5f5b',
        fontWeight: 700,
    },
    '& .row-new': { bgcolor: 'rgba(46, 125, 50, 0.08)' },
    '& .row-modified': { bgcolor: 'rgba(237, 108, 2, 0.08)' },
    '& .row-current': { boxShadow: 'inset 3px 0 0 #1976d2' },
};
// 모든 컬럼 헤더/데이터 가운데 정렬 (작업지시 그리드와 동일)
export function centerColumns<R extends GridValidRowModel>(columns: GridColDef<R>[]): GridColDef<R>[] {
    return columns.map((column) => ({ ...column, align: 'center', headerAlign: 'center' }));
}
