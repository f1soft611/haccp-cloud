import { TextField, type TextFieldProps } from '@mui/material';

type AppTextFieldProps = Pick<
    TextFieldProps,
    | 'label' | 'value' | 'size' | 'sx' | 'fullWidth' | 'required' | 'disabled'
    | 'error' | 'helperText' | 'placeholder' | 'autoComplete' | 'autoFocus'
    | 'multiline' | 'rows' | 'minRows' | 'slotProps' | 'onKeyDown' | 'onClick'
> & {
    type?: 'text' | 'number' | 'password' | 'email';
    onChange?: (value: string) => void;
};

// 공통 텍스트 입력칸. onChange 로 이벤트 대신 입력값을 넘긴다.
export function AppTextField({ onChange, ...textFieldProps }: AppTextFieldProps) {
    return (
        <TextField
            {...textFieldProps}
            onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        />
    );
}