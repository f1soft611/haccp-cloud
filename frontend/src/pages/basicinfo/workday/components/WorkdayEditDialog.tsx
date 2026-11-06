import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Stack,
    TextField,
} from '@mui/material';
import { useState } from 'react';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import type { WorkdayItem, WorkdayType } from '../../../../services/basicinfo/workday/workdayService';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import { useCommonCodeOptions } from '../../../../shared/hooks/useCommonCodeOptions';

type WorkdayEditDialogProps = {
    item: WorkdayItem;
    onClose: () => void;
    onSubmit: (item: WorkdayItem) => void;
};

export function WorkdayEditDialog({ item, onClose, onSubmit }: WorkdayEditDialogProps) {
    const [dayType, setDayType] = useState<WorkdayType>(item.dayType);
    const [dayName, setDayName] = useState(item.dayName);
    const [memo, setMemo] = useState(item.memo);

    const typeOptions = useCommonCodeOptions(COMMON_CODE_GROUP.WORKDAY_TYPE);
    // 조회 전이거나 미사용 처리된 현재 값도 셀렉트에 보이도록 덧붙임
    const selectOptions = typeOptions.some((option) => option.code === dayType)
        ? typeOptions
        : [...typeOptions, { code: dayType, name: dayType }];

    return (
        <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{item.workdayDate}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <AppSelect
                        label="유형"
                        value={dayType}
                        onChange={setDayType}
                        options={selectOptions.map((option) => ({
                            value: option.code as WorkdayType,
                            label: option.name,
                        }))}
                    />
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
                        inputProps={{ maxLength: 100 }}
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
                            source: dayType !== item.dayType ? 'MANUAL' : item.source,
                        })
                    }
                >
                    확인
                </Button>
            </DialogActions>
        </Dialog>
    );
}