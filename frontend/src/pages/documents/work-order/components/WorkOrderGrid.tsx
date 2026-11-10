import { Trash } from 'lucide-react';
import { EditPencilIcon } from '../../../../shared/components/data/EditPencilIcon';
import { Stack, TableBody, TableCell, TableHead, TableRow, Tooltip } from '@mui/material';
import { AdminGrid } from '../../../../shared/components/data/AdminGrid';
import type { WorkOrderRow } from '../types';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import {
    getCommonCodeName,
    useCommonCodeOptions,
} from '../../../../shared/hooks/useCommonCodeOptions';
import {GridIconButton} from "../../../../shared/components/data/GridIconButton.tsx";

export function WorkOrderGrid(props: {
    rows: WorkOrderRow[];
    onEdit: (row: WorkOrderRow) => void;
    onDelete: (row: WorkOrderRow) => void;
}) {
    const { rows, onEdit, onDelete } = props;
    const unitOptions = useCommonCodeOptions(COMMON_CODE_GROUP.ITEM_UNIT);

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
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                <Tooltip title="작업지시 수정">
                                    <span>
                                        <GridIconButton
                                            aria-label="작업지시 수정"
                                            onClick={() => onEdit(row)}
                                        >
                                            <EditPencilIcon />
                                        </GridIconButton>
                                    </span>
                                </Tooltip>
                                <Tooltip title="작업지시 삭제">
                                    <span>
                                        <GridIconButton
                                            aria-label="작업지시 삭제"
                                            tone="danger"
                                            onClick={() => onDelete(row)}
                                        >
                                            {/* 기존 -> MUI 아이콘 / 변경 -> lucide 아이콘 */}
                                            <Trash />
                                        </GridIconButton>
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