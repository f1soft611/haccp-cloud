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
        >
            {allowEmpty ? <MenuItem value="">선택 안 함</MenuItem> : null}
            {hasOrphanValue ? <MenuItem value={value}>{value}</MenuItem> : null}
            {options.map((option) => (
                <MenuItem key={option.code} value={option.code}>
                    {option.name}
                </MenuItem>
            ))}
        </TextField>
    );
}