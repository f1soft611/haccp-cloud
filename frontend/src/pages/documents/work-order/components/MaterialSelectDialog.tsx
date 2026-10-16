import {
    Button,
    MenuItem,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
    listMaterialsPaged,
    type MaterialItem,
} from '../../../../services/basicinfo/materialsService';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import {
    getCommonCodeName,
    useCommonCodeOptions,
} from '../../../../shared/hooks/useCommonCodeOptions';
import { useAuthStore } from '../../../../shared/store/authStore';

// 작업지시 대상 품목계정: 제품, 반제품 (모든 테넌트 공통 코드)
const WORK_ORDER_ITEM_TYPES = ['PRODUCT', 'SEMI'];
const PAGE_SIZE = 10;

// itemType '' = 전체(제품+반제품)
type MaterialFilter = { itemType: string; keyword: string };
const EMPTY_FILTER: MaterialFilter = { itemType: '', keyword: '' };

export function MaterialSelectDialog(props: {
    open: boolean;
    selectedId?: string;
    onClose: () => void;
    onSelect: (material: MaterialItem) => void;
}) {
    const { open, selectedId, onClose, onSelect } = props;
    const tenantCode = useAuthStore((state) => state.tenantCode);
    const itemTypeOptions = useCommonCodeOptions(COMMON_CODE_GROUP.ITEM_TYPE);
    const unitOptions = useCommonCodeOptions(COMMON_CODE_GROUP.ITEM_UNIT);
    // draft = 입력 중인 필터, applied = [검색] 시 반영된 필터
    const [draft, setDraft] = useState<MaterialFilter>(EMPTY_FILTER);
    const [applied, setApplied] = useState<MaterialFilter>(EMPTY_FILTER);
    const [page, setPage] = useState(0);

    useEffect(() => {
        if (!open) return;
        setDraft(EMPTY_FILTER);
        setApplied(EMPTY_FILTER);
        setPage(0);
    }, [open]);

    const materialsQuery = useQuery({
        queryKey: ['work-order-material-select', tenantCode || 'self', applied, page],
        queryFn: () =>
            listMaterialsPaged({
                tenantCode: tenantCode || undefined,
                pageIndex: page + 1,
                pageSize: PAGE_SIZE,
                keyword: applied.keyword || undefined,
                itemTypes: applied.itemType ? [applied.itemType] : WORK_ORDER_ITEM_TYPES,
            }),
        enabled: open,
        retry: false,
    });

    const items = materialsQuery.data?.items ?? [];

    const handleSearch = () => {
        setApplied({ ...draft, keyword: draft.keyword.trim() });
        setPage(0);
    };

    return (
        <FormDialog
            open={open}
            title="품목 선택"
            maxWidth="md"
            onClose={onClose}
            actions={
                <Button variant="outlined" onClick={onClose}>
                    취소
                </Button>
            }
        >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
                <TextField
                    select
                    size="small"
                    label="품목계정"
                    value={draft.itemType}
                    onChange={(event) => setDraft((prev) => ({ ...prev, itemType: event.target.value }))}
                    sx={{ minWidth: 140 }}
                >
                    <MenuItem value="">전체</MenuItem>
                    {WORK_ORDER_ITEM_TYPES.map((code) => (
                        <MenuItem key={code} value={code}>
                            {getCommonCodeName(itemTypeOptions, code)}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    size="small"
                    fullWidth
                    label="검색어"
                    placeholder="품목코드, 품목명, 규격"
                    value={draft.keyword}
                    onChange={(event) => setDraft((prev) => ({ ...prev, keyword: event.target.value }))}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') handleSearch();
                    }}
                />
                <Button variant="contained" onClick={handleSearch} sx={{ minWidth: 80 }}>
                    검색
                </Button>
            </Stack>
            <Table size="small" aria-label="품목 목록">
                <TableHead>
                    <TableRow>
                        <TableCell>품목코드</TableCell>
                        <TableCell>품목명</TableCell>
                        <TableCell>품목계정</TableCell>
                        <TableCell>규격</TableCell>
                        <TableCell>단위</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} align="center">
                                {materialsQuery.isFetching ? '조회 중...' : '검색된 품목이 없습니다.'}
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((item) => (
                            <TableRow
                                key={item.id}
                                hover
                                selected={item.id === selectedId}
                                onClick={() => onSelect(item)}
                                sx={{ cursor: 'pointer' }}
                            >
                                <TableCell>{item.materialCode}</TableCell>
                                <TableCell>{item.materialName}</TableCell>
                                <TableCell>{getCommonCodeName(itemTypeOptions, item.itemType)}</TableCell>
                                <TableCell>{item.materialSpec}</TableCell>
                                <TableCell>{getCommonCodeName(unitOptions, item.unit)}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            <TablePagination
                component="div"
                count={materialsQuery.data?.totalCount ?? 0}
                page={page}
                rowsPerPage={PAGE_SIZE}
                rowsPerPageOptions={[]}
                onPageChange={(_, nextPage) => setPage(nextPage)}
            />
        </FormDialog>
    );
}