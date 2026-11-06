import { MenuItem, TextField, type SelectProps, type TextFieldProps } from '@mui/material';

export type AppSelectOption<T extends string = string> = {
    value: T;
    label: string;
};

type AppSelectProps<T extends string> = Pick<
    TextFieldProps,
    'label' | 'size' | 'sx' | 'fullWidth' | 'required' | 'disabled' | 'helperText'
> & {
    value: T;
    onChange: (value: T) => void;
    options: readonly AppSelectOption<T>[];
    // 넘기면 값이 '' 인 첫 항목을 추가하고, 비어 있어도 이 문구를 칸에 표시한다.
    emptyLabel?: string;
    selectProps?: Pick<SelectProps, 'renderValue' | 'SelectDisplayProps'>;
};

// 공통 단일 선택 셀렉트박스. 옵션 렌더링과 빈 값 표시를 맡는다.
export function AppSelect<T extends string = string>({
    onChange,
    options,
    emptyLabel,
    selectProps,
    ...textFieldProps
}: AppSelectProps<T>) {
    const hasEmptyOption = emptyLabel !== undefined;

    return (
        <TextField
            {...textFieldProps}
            select
            onChange={(event) => onChange(event.target.value as T)}
            slotProps={{
                select: { displayEmpty: hasEmptyOption, ...selectProps },
                inputLabel: hasEmptyOption ? { shrink: true } : undefined,
            }}
        >
            {hasEmptyOption ? <MenuItem value="">{emptyLabel}</MenuItem> : null}
            {options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                    {option.label}
                </MenuItem>
            ))}
        </TextField>
    );
}