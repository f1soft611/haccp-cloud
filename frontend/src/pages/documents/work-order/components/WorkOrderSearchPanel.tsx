import { Button, Paper, Stack, TextField } from '@mui/material';
import type { WorkOrderSearchValue } from '../types';

export function WorkOrderSearchPanel(props: {
    value: WorkOrderSearchValue;
    onChange: (next: WorkOrderSearchValue) => void;
    onReset: () => void;
    onSearch: () => void;
}) {
    const { value, onChange, onReset, onSearch } = props;

    return (
        <Paper sx={{ p: 2 }}>
            <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1}
                alignItems={{ xs: 'stretch', md: 'center' }}
            >
                <TextField
                    size="small"
                    type="date"
                    label="생산일자 시작"
                    value={value.startDate}
                    onChange={(event) => onChange({ ...value, startDate: event.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                    size="small"
                    type="date"
                    label="생산일자 종료"
                    value={value.endDate}
                    onChange={(event) => onChange({ ...value, endDate: event.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                    size="small"
                    label="품명"
                    value={value.itemName}
                    onChange={(event) => onChange({ ...value, itemName: event.target.value })}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') onSearch();
                    }}
                />
                <Stack direction="row" spacing={1} sx={{ ml: { md: 'auto' } }}>
                    <Button variant="outlined" onClick={onReset}>
                        초기화
                    </Button>
                    <Button variant="contained" onClick={onSearch}>
                        조회
                    </Button>
                </Stack>
            </Stack>
        </Paper>
    );
}