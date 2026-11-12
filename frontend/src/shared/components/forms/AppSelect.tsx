import type { CSSProperties, ReactNode } from 'react';
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

// 셀렉트 펼침 목록 보더를 포커스된 칸 테두리색(primary)과 맞추는 공용 MenuProps
export const appSelectMenuProps: SelectProps['MenuProps'] = {
    slotProps: {
        paper: {
            sx: {
                border: '1px solid',
                borderColor: 'primary.main',
                borderRadius: '4px',
            },
        },
    },
};

const ALL_LABEL = '전체';

// 화면에는 안 보이지만 스크린리더와 텍스트 검사에는 남기는 스타일
const visuallyHiddenStyle: CSSProperties = {
    position: 'absolute',
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    border: 0,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
};

// '전체' 선택 시 칸 안에 보일 라벨. " (전체)" 는 aria-hidden 이라 접근성 이름은 원래 라벨 그대로
export function SelectAllLabel({ label }: { label: ReactNode }) {
    return (
        <>
            {label}
            <span aria-hidden="true"> ({ALL_LABEL})</span>
        </>
    );
}

// '전체' 선택 시 값 칸 내용. 화면에서는 숨기고 스크린리더에는 '전체'를 읽힌다
export function SelectAllValue() {
    return <span style={visuallyHiddenStyle}>{ALL_LABEL}</span>;
}

// 공통 단일 선택 셀렉트박스. 옵션 렌더링, 빈 값 표시, 선택 문구가 '전체'일 때 라벨을 칸 안에 표시하는 일을 맡는다.
export function AppSelect<T extends string = string>({
    value,
    onChange,
    options,
    emptyLabel,
    selectProps,
    label,
    ...textFieldProps
}: AppSelectProps<T>) {
    const hasEmptyOption = emptyLabel !== undefined;
    const selectedLabel =
        hasEmptyOption && value === '' ? emptyLabel : options.find((option) => option.value === value)?.label;
    const isAll = Boolean(label) && selectedLabel === ALL_LABEL;

    // 전체면 라벨을 칸 안에 두고(노치 없음), 그 외에는 기존처럼 빈 항목이 있을 때만 라벨을 띄운다.
    const inputLabelProps = isAll ? { shrink: false } : hasEmptyOption ? { shrink: true } : undefined;

    return (
        <TextField
            {...textFieldProps}
            value={value}
            label={isAll ? <SelectAllLabel label={label} /> : label}
            select
            onChange={(event) => onChange(event.target.value as T)}
            slotProps={{
                select: {
                    displayEmpty: hasEmptyOption,
                    MenuProps: appSelectMenuProps,
                    ...selectProps,
                    ...(isAll ? { displayEmpty: true, notched: false, renderValue: () => <SelectAllValue /> } : {}),
                },
                inputLabel: inputLabelProps,
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