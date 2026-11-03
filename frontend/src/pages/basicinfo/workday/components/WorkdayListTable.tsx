import {
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
} from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import type { WorkdayItem, WorkdayType } from '../../../../services/basicinfo/workday/workdayService';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import { useCommonCodeOptions } from '../../../../shared/hooks/useCommonCodeOptions';
import { isRedDay } from '../workdayRules';

dayjs.locale('ko');

type WorkdayListTableProps = {
    items: WorkdayItem[];
    changedDates: Set<string>;
    onChangeType: (item: WorkdayItem, dayType: WorkdayType) => void;
};

export function WorkdayListTable({ items, changedDates, onChangeType }: WorkdayListTableProps) {
    const typeOptions = useCommonCodeOptions(COMMON_CODE_GROUP.WORKDAY_TYPE);

    return (
        <TableContainer sx={{ maxHeight: 640 }}>
            <Table size="small" stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell width={140}>날짜</TableCell>
                        <TableCell width={80}>요일</TableCell>
                        <TableCell width={200}>휴무일 구분</TableCell>
                        <TableCell>휴일명</TableCell>
                        <TableCell>메모</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {items.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                                조회된 업무일이 없습니다.
                            </TableCell>
                        </TableRow>
                    ) : (
                        items.map((item) => {
                            const dateColor = isRedDay(item.dayType) ? 'error.main' : undefined;
                            // 조회 전이거나 미사용 처리된 현재 값도 셀렉트에 보이도록 덧붙임
                            const selectOptions = typeOptions.some((option) => option.code === item.dayType)
                                ? typeOptions
                                : [...typeOptions, { code: item.dayType, name: item.dayType }];
                            return (
                                <TableRow
                                    key={item.workdayDate}
                                    sx={changedDates.has(item.workdayDate) ? { bgcolor: 'action.selected' } : undefined}
                                >
                                    <TableCell sx={{ color: dateColor }}>{item.workdayDate}</TableCell>
                                    <TableCell sx={{ color: dateColor }}>{dayjs(item.workdayDate).format('dd')}</TableCell>
                                    <TableCell>
                                        <TextField
                                            select
                                            size="small"
                                            fullWidth
                                            value={item.dayType}
                                            onChange={(event) => onChangeType(item, event.target.value as WorkdayType)}
                                            inputProps={{ 'aria-label': `${item.workdayDate} 휴무일 구분` }}
                                        >
                                            {selectOptions.map((option) => (
                                                <MenuItem key={option.code} value={option.code}>
                                                    {option.name}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </TableCell>
                                    <TableCell>{item.dayName}</TableCell>
                                    <TableCell>{item.memo}</TableCell>
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}