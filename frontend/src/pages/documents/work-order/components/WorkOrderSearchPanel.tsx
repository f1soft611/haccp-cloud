import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Button, TextField } from '@mui/material';
import { SearchFilterBar } from '../../../../shared/components/forms/SearchFilterBar';
import type { WorkOrderSearchValue } from '../types';

export function WorkOrderSearchPanel(props: {
    value: WorkOrderSearchValue;
    onChange: (next: WorkOrderSearchValue) => void;
    onReset: () => void;
    onSearch: () => void;
    onCreate: () => void;
}) {
    const { value, onChange, onReset, onSearch, onCreate } = props;

    return (
        <SearchFilterBar
            onSearch={onSearch}
            onReset={onReset}
            actions={
                <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={onCreate}>
                    신규
                </Button>
            }
        >
            <TextField
                size="small"
                type="date"
                label="생산계획일 시작"
                value={value.startDate}
                onChange={(event) => onChange({ ...value, startDate: event.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
                size="small"
                type="date"
                label="생산계획일 종료"
                value={value.endDate}
                onChange={(event) => onChange({ ...value, endDate: event.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
                size="small"
                label="품명"
                value={value.itemName}
                onChange={(event) => onChange({ ...value, itemName: event.target.value })}
            />
        </SearchFilterBar>
    );
}