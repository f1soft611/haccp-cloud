import { TextField, type TextFieldProps } from '@mui/material';

type AppDateFieldProps = Pick<
    TextFieldProps,
    'label' | 'size' | 'sx' | 'fullWidth' | 'required' | 'disabled' | 'error' | 'helperText'
> & {
    value: string;
    onChange: (value: string) => void;
    min?: string;
    max?: string;
};

// 공통 날짜 입력칸. 브라우저 기본 달력을 쓰고 YYYY-MM-DD 문자열을 주고받는다.
export function AppDateField({ onChange, min, max, ...textFieldProps }: AppDateFieldProps) {
    return (
        <TextField
            {...textFieldProps}
            type="date"
            onChange={(event) => onChange(event.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min, max } }}
        />
    );
}