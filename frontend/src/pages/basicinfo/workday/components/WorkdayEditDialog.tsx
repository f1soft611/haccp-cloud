import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Stack,
    TextField,
} from '@mui/material';
import { useState } from 'react';
import type { WorkdayItem, WorkdayType } from '../../../../services/basicinfo/workday/workdayService';
import { WORKDAY_TYPES, WORKDAY_TYPE_LABELS } from '../workdayRules';

type WorkdayEditDialogProps = {
    item: WorkdayItem;
    onClose: () => void;
    onSubmit: (item: WorkdayItem) => void;
};

export function WorkdayEditDialog({ item, onClose, onSubmit }: WorkdayEditDialogProps) {
    const [dayType, setDayType] = useState<WorkdayType>(item.dayType);
    const [dayName, setDayName] = useState(item.dayName);
    const [memo, setMemo] = useState(item.memo);

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{item.workdayDate}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <TextField
                        select
                        label="유형"
                        value={dayType}
                        onChange={(event) => setDayType(event.target.value as WorkdayType)}
                    >
                        {WORKDAY_TYPES.map((type) => (
                            <MenuItem key={type} value={type}>
                                {WORKDAY_TYPE_LABELS[type]}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="휴일명"
                        value={dayName}
                        onChange={(event) => setDayName(event.target.value)}
                        inputProps={{ maxLength: 100 }}
                    />
                    <TextField
                        label="메모"
                        value={memo}
                        onChange={(event) => setMemo(event.target.value)}
                        multiline
                        minRows={2}
                        inputProps={{ maxLength: 500 }}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>취소</Button>
                <Button
                    variant="contained"
                    onClick={() =>
                        onSubmit({
                            ...item,
                            dayType,
                            dayName: dayName.trim(),
                            memo: memo.trim(),
                            source: 'MANUAL',
                        })
                    }
                >
                    확인
                </Button>
            </DialogActions>
        </Dialog>
    );
}