import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { Button } from '@mui/material';
import { AppDateField } from '../../../../shared/components/forms/AppDateField';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
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
            <AppDateField
                size="small"
                label="생산계획일 시작"
                value={value.startDate}
                onChange={(startDate) => onChange({ ...value, startDate })}
            />
            <AppDateField
                size="small"
                label="생산계획일 종료"
                value={value.endDate}
                onChange={(endDate) => onChange({ ...value, endDate })}
            />
            <AppTextField
                size="small"
                label="품명"
                value={value.itemName}
                onChange={(itemName) => onChange({ ...value, itemName })}
            />
        </SearchFilterBar>
    );
}