import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { IconButton, Stack, TableBody, TableCell, TableHead, TableRow, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import type { WorkOrderRow } from '../types';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import {
    getCommonCodeName,
    useCommonCodeOptions,
} from '../../../../shared/hooks/useCommonCodeOptions';

export function WorkOrderGrid(props: {
    rows: WorkOrderRow[];
    onEdit: (row: WorkOrderRow) => void;
    onDelete: (row: WorkOrderRow) => void;
}) {
    const { rows, onEdit, onDelete } = props;
    const isDarkMode = useTheme().palette.mode === 'dark';
    const unitOptions = useCommonCodeOptions(COMMON_CODE_GROUP.ITEM_UNIT);

    const actionIconSx = {
        color: isDarkMode ? '#fbbf24' : '#1f4f8f',
        bgcolor: isDarkMode ? 'rgba(251, 191, 36, 0.12)' : 'rgba(31, 79, 143, 0.08)',
        '&:hover': {
            bgcolor: isDarkMode ? 'rgba(251, 191, 36, 0.2)' : 'rgba(31, 79, 143, 0.16)',
        },
    };

    const dangerIconSx = {
        color: isDarkMode ? '#f87171' : '#c53b3b',
        bgcolor: isDarkMode ? 'rgba(248, 113, 113, 0.12)' : 'rgba(197, 59, 59, 0.08)',
        '&:hover': {
            bgcolor: isDarkMode ? 'rgba(248, 113, 113, 0.2)' : 'rgba(197, 59, 59, 0.16)',
        },
    };

    return (
        <AdminGrid ariaLabel="작업지시 목록">
            <TableHead>
                <TableRow>
                    <TableCell align="center" width={140}>작업지시번호</TableCell>
                    <TableCell align="center">품명</TableCell>
                    <TableCell align="center" width={120}>생산계획일</TableCell>
                    <TableCell align="center" width={120}>소비기한</TableCell>
                    <TableCell align="center" width={100}>생산량</TableCell>
                    <TableCell align="center" width={80}>단위</TableCell>
                    <TableCell align="center" width={120}>규격</TableCell>
                    <TableCell align="center">비고</TableCell>
                    <TableCell align="center" width={120}>작업</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {rows.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={9} align="center">
                            조회된 작업지시가 없습니다.
                        </TableCell>
                    </TableRow>
                ) : null}

                {rows.map((row) => (
                    <TableRow key={row.id} hover>
                        <TableCell align="center">{row.workdtNo}</TableCell>
                        <TableCell align="center">{row.itemName}</TableCell>
                        <TableCell align="center">{row.productionDate}</TableCell>
                        <TableCell align="center">{row.expiryDate}</TableCell>
                        <TableCell align="center">{row.quantity?.toLocaleString() ?? '-'}</TableCell>
                        <TableCell align="center">{getCommonCodeName(unitOptions, row.unit) || '-'}</TableCell>
                        <TableCell align="center">{row.spec || '-'}</TableCell>
                        <TableCell align="center">{row.remark || '-'}</TableCell>
                        <TableCell align="center">
                            {/* 기존 -> spacing 1, 툴팁 없음, sx 인라인 / 변경 -> HACCP 문서현황 기준 spacing 0.5, Tooltip, sx 상수 */}
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                <Tooltip title="작업지시 수정">
                                    <span>
                                        <IconButton
                                            size="small"
                                            aria-label="작업지시 수정"
                                            onClick={() => onEdit(row)}
                                            sx={actionIconSx}
                                        >
                                            <EditOutlinedIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title="작업지시 삭제">
                                    <span>
                                        <IconButton
                                            size="small"
                                            aria-label="작업지시 삭제"
                                            onClick={() => onDelete(row)}
                                            sx={dangerIconSx}
                                        >
                                            <DeleteOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Stack>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </AdminGrid>
    );
}