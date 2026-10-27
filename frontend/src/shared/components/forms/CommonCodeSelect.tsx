import { MenuItem, TextField, type TextFieldProps } from '@mui/material';
import type { CommonCodeGroupCode } from '../../constants/commonCodeGroups';
import { useCommonCodeOptions } from '../../hooks/useCommonCodeOptions';

type CommonCodeSelectProps = {
    groupCode: CommonCodeGroupCode;
    label: string;
    value: string;
    onChange: (code: string) => void;
    required?: boolean;
    allowEmpty?: boolean;
    fullWidth?: boolean;
    size?: TextFieldProps['size'];
    disabled?: boolean;
    emptyLabel?: string;
};

export function CommonCodeSelect({
                                     groupCode,
                                     label,
                                     value,
                                     onChange,
                                     required,
                                     allowEmpty = true,
                                     fullWidth,
                                     size,
                                     disabled,
                                     // 기존 -> emptyLabel = '선택 안 함',
                                     // 변경 -> 기본값 제거, 넘긴 경우에만 빈 값 문구를 콤보박스에 표시
                                     emptyLabel,
                                 }: CommonCodeSelectProps) {
    const options = useCommonCodeOptions(groupCode);
    // 미사용 처리된 코드 등 옵션에 없는 값도 MUI out-of-range 경고 없이 표시
    const hasOrphanValue = !!value && !options.some((option) => option.code === value);

    return (
        <TextField
            select
            label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            fullWidth={fullWidth}
            size={size}
            disabled={disabled}
            helperText={options.length === 0 ? `공통코드 ${groupCode}를 먼저 등록하세요.` : undefined}
            slotProps={emptyLabel ? { select: { displayEmpty: true }, inputLabel: { shrink: true } } : undefined}
        >
            {/* 기존 -> {allowEmpty ? <MenuItem value="">{emptyLabel}</MenuItem> : null} */}
            {/* 변경 -> emptyLabel 기본값 제거에 따라 미지정 시 '선택 안 함' */}
            {allowEmpty ? <MenuItem value="">{emptyLabel ?? '선택 안 함'}</MenuItem> : null}
            {hasOrphanValue ? <MenuItem value={value}>{value}</MenuItem> : null}
            {options.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                    {option.name}
                </MenuItem>
            ))}
        </TextField>
    );
}