import type { TextFieldProps } from '@mui/material';
import type { CommonCodeGroupCode } from '../../constants/commonCodeGroups';
import { useCommonCodeOptions } from '../../hooks/useCommonCodeOptions';
import { AppSelect } from './AppSelect';

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

    // emptyLabel 이 없으면 칸에 문구를 표시하지 않도록 빈 항목을 일반 옵션으로 넣는다.
    const selectOptions = [
        ...(allowEmpty && emptyLabel === undefined ? [{ value: '', label: '선택 안 함' }] : []),
        ...(hasOrphanValue ? [{ value, label: value }] : []),
        ...options.map((option) => ({ value: option.code, label: option.name })),
    ];

    return (
        <AppSelect
            label={label}
            value={value}
            onChange={onChange}
            required={required}
            fullWidth={fullWidth}
            size={size}
            disabled={disabled}
            helperText={options.length === 0 ? `공통코드 ${groupCode}를 먼저 등록하세요.` : undefined}
            emptyLabel={allowEmpty ? emptyLabel : undefined}
            options={selectOptions}
        />
    );
}