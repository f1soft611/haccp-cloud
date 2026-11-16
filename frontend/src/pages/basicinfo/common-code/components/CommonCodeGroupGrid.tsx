import { ChevronDown, ChevronRight, Plus, Save, Trash } from 'lucide-react';
import { useMemo } from 'react';
import { Box, Button, IconButton, Paper, Stack, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { koKR } from '@mui/x-data-grid/locales';
import { appTheme } from '../../../../app/theme';
import { collectDescendantIds, markEdited } from '../commonCodeRows';
import type { CommonCodeGroupRow, CommonCodeGroupTreeRow } from '../types';
import { centerColumns, COMMON_CODE_GRID_SX, TOOLBAR_BUTTON_SX } from './gridStyles';

const EDITABLE_FIELDS = ['groupCode', 'groupName', 'groupDesc', 'parentId'] as const;

export function CommonCodeGroupGrid(props: {
    rows: CommonCodeGroupTreeRow[];
    allRows: CommonCodeGroupRow[];
    collapsedIds: ReadonlySet<string>;
    selectedId: string | null;
    canManage: boolean;
    saveDisabled: boolean;
    onToggle: (id: string) => void;
    onSelect: (id: string) => void;
    onRowUpdate: (row: CommonCodeGroupRow) => void;
    onAdd: () => void;
    onDelete: () => void;
    onSave: () => void;
}) {
    const { rows, allRows, collapsedIds, selectedId, canManage, saveDisabled, onToggle, onSelect, onRowUpdate, onAdd, onDelete, onSave } = props;

    const columns = useMemo<GridColDef<CommonCodeGroupTreeRow>[]>(
        () => [
            {
                field: 'groupName',
                headerName: '그룹명 *',
                headerAlign: 'center',
                editable: true,
                flex: 1.4,
                minWidth: 160,
                // 트리 표시: 깊이만큼 들여쓰고, 하위 그룹이 있으면 접기/펼치기 버튼
                renderCell: ({ row }) => {
                    const collapsed = collapsedIds.has(row.id);
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', height: '100%', pl: row.depth * 2 }}>
                            {row.hasChildren ? (
                                <IconButton
                                    size="small"
                                    aria-label={`${row.groupName} ${collapsed ? '펼치기' : '접기'}`}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        onToggle(row.id);
                                    }}
                                >
                                    {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                </IconButton>
                            ) : (
                                <Box component="span" sx={{ width: 28, flexShrink: 0 }} />
                            )}
                            <span>{row.groupName}</span>
                        </Box>
                    );
                },
            },
            ...centerColumns<CommonCodeGroupTreeRow>([
                { field: 'groupCode', headerName: '그룹코드 *', editable: true, flex: 1.2, minWidth: 150 },
                {
                    field: 'parentId',
                    headerName: '상위그룹',
                    type: 'singleSelect',
                    editable: true,
                    flex: 1,
                    minWidth: 140,
                    // 자기 자신과 하위 그룹은 상위로 고를 수 없게 해 순환을 막는다
                    valueOptions: ({ row }) => {
                        const excluded = row ? collectDescendantIds(allRows, row.id) : new Set<string>();
                        return [
                            { value: '', label: '(없음)' },
                            ...allRows
                            .filter((group) => !excluded.has(group.id))
                            .map((group) => ({ value: group.id, label: group.groupName || group.groupCode || '신규 그룹' })),
                        ];
                    },
                },
                { field: 'groupDesc', headerName: '그룹 설명', editable: true, flex: 1.6, minWidth: 160 },
            ]),
        ],
        [allRows, collapsedIds, onToggle],
    );

    const processRowUpdate = (newRow: CommonCodeGroupTreeRow, oldRow: CommonCodeGroupTreeRow) => {
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
                        <Button size="small" variant="outlined" sx={TOOLBAR_BUTTON_SX} startIcon={<Plus />} aria-label="그룹 추가" onClick={onAdd}>
                            추가
                        </Button>
                        <Button size="small" variant="outlined" color="error" sx={TOOLBAR_BUTTON_SX} startIcon={<Trash />} aria-label="그룹 삭제" onClick={onDelete}>
                            삭제
                        </Button>
                        <Button size="small" variant="outlined" sx={TOOLBAR_BUTTON_SX} startIcon={<Save />} aria-label="그룹 저장" disabled={saveDisabled} onClick={onSave}>
                            저장
                        </Button>
                    </Stack>
                ) : null}
            </Stack>
            <Box sx={{ flex: 1, minHeight: 0 }}>
                <ThemeProvider theme={appTheme}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
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
                </ThemeProvider>
            </Box>
        </Paper>
    );
}