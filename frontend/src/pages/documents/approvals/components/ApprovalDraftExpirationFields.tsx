import { MenuItem, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { listEquipmentPaged } from '../../../../services/basicinfo/equipmentService';
import type { ApprovalSubValues } from '../../../../services/documents/haccpBaseWorkService';
import type { UserItem } from '../../../../services/organization/usersService';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import { useCommonCodeOptions } from '../../../../shared/hooks/useCommonCodeOptions';
import {
    getApprovalSubTargetKey,
    type ApprovalSubFieldConfig,
} from '../utils/approvalSubFields';

type ApprovalDraftExpirationFieldsProps = {
    tenantCode: string;
    config: ApprovalSubFieldConfig;
    value: ApprovalSubValues;
    onChange?: (next: ApprovalSubValues) => void;
    users: UserItem[];
    isReadOnly?: boolean;
};

export function ApprovalDraftExpirationFields(
    props: ApprovalDraftExpirationFieldsProps,
) {
    const { tenantCode, config, value, onChange, users, isReadOnly = false } =
        props;

    const materialTypeOptions = useCommonCodeOptions(
        COMMON_CODE_GROUP.MATERIAL_TYPE,
    );
    // ponytail: 사용 중 설비 최대 1000건 한 번에 조회. 설비가 더 많아지면 검색형 Autocomplete 로 교체
    const equipmentQuery = useQuery({
        queryKey: ['approval-sub-equipment', tenantCode],
        queryFn: () =>
            listEquipmentPaged({
                tenantCode,
                pageIndex: 1,
                pageSize: 1000,
                filterActive: 'Y',
            }),
        enabled: config.target === 'equipment' && Boolean(tenantCode),
    });

    const targetKey = getApprovalSubTargetKey(config);
    const targetOptions =
        config.target === 'equipment'
            ? (equipmentQuery.data?.items ?? []).map((item) => ({
                value: item.id,
                label: item.equipNm,
            }))
            : config.target === 'materialType'
                ? materialTypeOptions.map((option) => ({
                    value: option.code,
                    label: option.name,
                }))
                : users.map((user) => ({ value: user.id, label: user.name }));

    const change = (key: keyof ApprovalSubValues, next: string) =>
        onChange?.({ ...value, [key]: next });

    return (
        <>
            <TextField
                select
                required
                label={config.targetLabel}
                value={value[targetKey]}
                onChange={(event) => change(targetKey, event.target.value)}
                disabled={isReadOnly}
                sx={{ minWidth: 0 }}
            >
                {targetOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                        {option.label}
                    </MenuItem>
                ))}
            </TextField>
            <TextField
                required
                label={config.inspectedLabel}
                type="date"
                value={value.inspectedDate}
                onChange={(event) => change('inspectedDate', event.target.value)}
                disabled={isReadOnly}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 0 }}
            />
            <TextField
                required
                label={config.expirationLabel}
                type="date"
                value={value.expirationDate}
                onChange={(event) => change('expirationDate', event.target.value)}
                disabled={isReadOnly}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 0 }}
            />
        </>
    );
}