import { useState } from 'react';
import { Autocomplete, Box, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { listEquipmentPaged } from '../../../../services/basicinfo/equipmentService';
import type { ApprovalSubValues } from '../../../../services/documents/haccpBaseWorkService';
import type { UserItem } from '../../../../services/organization/usersService';
import { UserSelectDialog } from '../../../../shared/components/forms/UserSelectDialog';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import { useCommonCodeOptions } from '../../../../shared/hooks/useCommonCodeOptions';
import {
    calcNextCalibDate,
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

    const [userDialogOpen, setUserDialogOpen] = useState(false);

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
    // 기존 -> 사원도 드롭다운 옵션으로 변환
    // 변경 -> 사원은 UserSelectDialog 로 선택하므로 옵션 없음
    const targetOptions =
        config.target === 'equipment'
            // 기존 -> 사용 중 설비 전체를 설비명(equipNm)만으로 표시
            // 변경 -> 검교정 구분(vcKind)이 없는 설비 제외, 설비명(규격) 형식으로 표시 (규격 없으면 설비명만)
            ? (equipmentQuery.data?.items ?? [])
            .filter((item) => item.vcKind)
            .map((item) => ({
                value: item.id,
                label: item.equipSpec
                    ? `${item.equipNm}(${item.equipSpec})`
                    : item.equipNm,
            }))
            : config.target === 'materialType'
                ? materialTypeOptions.map((option) => ({
                    value: option.code,
                    label: option.name,
                }))
                : [];
    const selectedUserName =
        users.find((user) => user.id === value.certificationUserId)?.name ?? '';

    // 검교정 업무에서 설비, 검교정일자, 설비 주기가 모두 있으면 차기예정일도 같이 세팅
    const withNextCalibDate = (next: ApprovalSubValues): ApprovalSubValues => {
        if (config.target !== 'equipment') {
            return next;
        }
        const cycle = equipmentQuery.data?.items.find(
            (item) => item.id === next.equipmentId,
        )?.vcCycle;
        return cycle && next.inspectedDate
            ? { ...next, expirationDate: calcNextCalibDate(next.inspectedDate, cycle) }
            : next;
    };

    // 기존 -> 바뀐 값 하나만 넣어 onChange
    // 변경 -> 차기예정일을 직접 고친 경우가 아니면 검교정 차기예정일 재계산
    const change = (key: keyof ApprovalSubValues, next: string) => {
        const updated = { ...value, [key]: next };
        onChange?.(key === 'expirationDate' ? updated : withNextCalibDate(updated));
    };

    const openUserDialog = () => {
        if (!isReadOnly) {
            setUserDialogOpen(true);
        }
    };

    return (
        <>
            {/* 기존 -> 사원도 드롭다운(select)으로 선택 */}
            {/* 변경 -> 사원은 읽기 전용 칸 클릭 시 참석자 dialog 와 같은 형식의 UserSelectDialog */}
            {config.target === 'user' ? (
                <TextField
                    required
                    label={config.targetLabel}
                    value={selectedUserName}
                    onClick={openUserDialog}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            openUserDialog();
                        }
                    }}
                    disabled={isReadOnly}
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ minWidth: 0, '& input': { cursor: isReadOnly ? 'default' : 'pointer' } }}
                />
            ) : (
                // 기존 -> TextField select + MenuItem 으로 목록에서만 선택
                // 변경 -> Autocomplete 로 타이핑하면 이름 부분 일치로 실시간 필터링, 매칭 글자 하이라이트
                <Autocomplete
                    options={targetOptions}
                    value={
                        targetOptions.find((option) => option.value === value[targetKey]) ??
                        null
                    }
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, selected) =>
                        option.value === selected.value
                    }
                    onChange={(_, selected) => change(targetKey, selected?.value ?? '')}
                    // ponytail: 첫 번째 매칭만 하이라이트. 같은 글자 반복 표시가 필요하면 indexOf 루프로 확장
                    renderOption={(props, option, { inputValue }) => {
                        const { key, ...optionProps } = props;
                        const start = inputValue
                            ? option.label.toLowerCase().indexOf(inputValue.toLowerCase())
                            : -1;
                        const end = start + inputValue.length;
                        return (
                            <li key={key} {...optionProps}>
                                {start < 0 ? (
                                    option.label
                                ) : (
                                    <>
                                        {option.label.slice(0, start)}
                                        <Box
                                            component="span"
                                            sx={{ fontWeight: 700, color: 'primary.main' }}
                                        >
                                            {option.label.slice(start, end)}
                                        </Box>
                                        {option.label.slice(end)}
                                    </>
                                )}
                            </li>
                        );
                    }}
                    noOptionsText="검색 결과 없음"
                    loading={equipmentQuery.isLoading}
                    loadingText="불러오는 중..."
                    disabled={isReadOnly}
                    sx={{ minWidth: 0 }}
                    renderInput={(params) => (
                        <TextField {...params} required label={config.targetLabel} />
                    )}
                />
            )}
            {userDialogOpen ? (
                <UserSelectDialog
                    users={users}
                    title="사원 선택"
                    selectedUserId={value.certificationUserId}
                    onClose={() => setUserDialogOpen(false)}
                    onConfirm={(user) => {
                        change('certificationUserId', user.id);
                        setUserDialogOpen(false);
                    }}
                />
            ) : null}
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