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
// data-date-state 는 미선택이면 "연도-월-일" 을 흐리게 보이는 CSS 가 쓴다.
export function AppDateField({ onChange, min, max, ...textFieldProps }: AppDateFieldProps) {
    return (
        <TextField
            {...textFieldProps}
            type="date"
            data-date-state={textFieldProps.value ? 'selected' : 'empty'}
            onChange={(event) => onChange(event.target.value)}
            slotProps={{ inputLabel: { shrink: true }, htmlInput: { min, max } }}
        />
    );
}