import {
    Alert,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControlLabel,
    FormGroup,
    Stack,
    Typography,
} from '@mui/material';
import { useState } from 'react';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export type WorkdayGenerateValue = {
    weeklyOffDays: number[];
    includePublicHolidays: boolean;
};

type WorkdayGenerateDialogProps = {
    year: number;
    hasExistingData: boolean;
    hasUnsavedChanges: boolean;
    loading: boolean;
    errorMessage?: string;
    onClose: () => void;
    onSubmit: (value: WorkdayGenerateValue) => void;
};

export function WorkdayGenerateDialog(props: WorkdayGenerateDialogProps) {
    const { year, hasExistingData, hasUnsavedChanges, loading, errorMessage, onClose, onSubmit } =
        props;
    const [weeklyOffDays, setWeeklyOffDays] = useState<number[]>([0, 6]);
    const [includePublicHolidays, setIncludePublicHolidays] = useState(true);

    const toggleDay = (day: number) =>
        setWeeklyOffDays((current) =>
            current.includes(day) ? current.filter((value) => value !== day) : [...current, day],
        );

    return (
        <Dialog open onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{year}년 업무일 생성</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <div>
                        <Typography variant="subtitle2">기본 휴무 요일</Typography>
                        <FormGroup row>
                            {WEEKDAY_LABELS.map((label, day) => (
                                <FormControlLabel
                                    key={label}
                                    label={label}
                                    control={
                                        <Checkbox
                                            size="small"
                                            checked={weeklyOffDays.includes(day)}
                                            onChange={() => toggleDay(day)}
                                        />
                                    }
                                />
                            ))}
                        </FormGroup>
                    </div>
                    <FormControlLabel
                        label="법정 공휴일 반영"
                        control={
                            <Checkbox
                                checked={includePublicHolidays}
                                onChange={(event) => setIncludePublicHolidays(event.target.checked)}
                            />
                        }
                    />
                    {hasExistingData ? (
                        <Alert severity="warning">
                            {year}년 기존 데이터를 덮어씁니다. 직접 수정한 날짜는 유지됩니다.
                        </Alert>
                    ) : null}
                    {hasUnsavedChanges ? (
                        <Alert severity="warning">저장하지 않은 {year}년 변경분은 사라집니다.</Alert>
                    ) : null}
                    {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    취소
                </Button>
                <Button
                    variant="contained"
                    disabled={loading}
                    onClick={() => onSubmit({ weeklyOffDays, includePublicHolidays })}
                >
                    생성
                </Button>
            </DialogActions>
        </Dialog>
    );
}