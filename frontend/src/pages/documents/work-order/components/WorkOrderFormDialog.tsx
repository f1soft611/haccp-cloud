import { Autocomplete, Button, Grid, TextField } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
    listMaterialsPaged,
    type MaterialItem,
} from '../../../../services/basicinfo/materialsService';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import { useAuthStore } from '../../../../shared/store/authStore';
import type { WorkOrderFormValue } from '../types';
import {
    calcDefaultExpiryDate,
    validateWorkOrderForm,
    type WorkOrderFormErrors,
} from '../workOrderRows';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import {
    getCommonCodeName,
    useCommonCodeOptions,
} from '../../../../shared/hooks/useCommonCodeOptions';

type MaterialOption = Pick<MaterialItem, 'id' | 'materialName' | 'unit' | 'materialSpec'>;

// 기존 -> itemName 만 직접 입력 / 변경 -> materialId 추가(품목 선택)
const EMPTY_VALUE: WorkOrderFormValue = {
    materialId: '',
    itemName: '',
    productionDate: '',
    expiryDate: '',
    quantity: null,
    unit: '',
    spec: '',
    remark: '',
};

// 기존 -> props 에 saving, workdtNo 없음
// 변경 -> 저장 중 버튼 비활성화, 수정 시 작업지시번호 표시
export function WorkOrderFormDialog(props: {
    open: boolean;
    mode: 'create' | 'edit';
    saving?: boolean;
    workdtNo?: string;
    initialValue?: WorkOrderFormValue;
    onClose: () => void;
    onSubmit: (value: WorkOrderFormValue) => void;
}) {
    const { open, mode, saving = false, workdtNo, initialValue, onClose, onSubmit } = props;
    const tenantCode = useAuthStore((state) => state.tenantCode);
    const [value, setValue] = useState<WorkOrderFormValue>(EMPTY_VALUE);
    const [errors, setErrors] = useState<WorkOrderFormErrors>({});
    const [materialKeyword, setMaterialKeyword] = useState('');
    const unitOptions = useCommonCodeOptions(COMMON_CODE_GROUP.ITEM_UNIT);

    useEffect(() => {
        if (!open) return;
        setValue(initialValue ?? EMPTY_VALUE);
        setErrors({});
        setMaterialKeyword('');
    }, [open, initialValue]);

    // ponytail: 입력할 때마다 조회(디바운스 없음), 품목이 많아 느려지면 디바운스 추가
    const materialsQuery = useQuery({
        queryKey: ['work-order-materials', tenantCode || 'self', materialKeyword],
        queryFn: () =>
            listMaterialsPaged({
                tenantCode: tenantCode || undefined,
                pageIndex: 1,
                pageSize: 50,
                keyword: materialKeyword || undefined,
            }),
        enabled: open,
        retry: false,
    });

    const selectedMaterial: MaterialOption | null = value.materialId
        ? { id: value.materialId, materialName: value.itemName, unit: value.unit, materialSpec: value.spec }
        : null;

    const setField = <K extends keyof WorkOrderFormValue>(field: K, next: WorkOrderFormValue[K]) =>
        setValue((prev) => ({ ...prev, [field]: next }));

    const handleSelectMaterial = (material: MaterialOption | null) =>
        setValue((prev) => ({
            ...prev,
            materialId: material?.id ?? '',
            itemName: material?.materialName ?? '',
            unit: material?.unit ?? '',
            spec: material?.materialSpec ?? '',
        }));

    // 생산계획일을 바꾸면 소비기한을 기본값(+1년)으로 다시 채운다. 이후 직접 수정 가능
    const handleChangeProductionDate = (productionDate: string) =>
        setValue((prev) => ({
            ...prev,
            productionDate,
            expiryDate: calcDefaultExpiryDate(productionDate),
        }));

    const handleSubmit = () => {
        const nextErrors = validateWorkOrderForm(value);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSubmit({ ...value, remark: value.remark.trim() });
    };

    return (
        <FormDialog
            open={open}
            title={mode === 'create' ? '작업지시 등록' : '작업지시 수정'}
            onClose={onClose}
            actions={
                <>
                    <Button variant="outlined" onClick={onClose} disabled={saving}>
                        취소
                    </Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={saving}>
                        저장
                    </Button>
                </>
            }
        >
            <Grid container spacing={2}>
                {workdtNo ? (
                    <Grid size={12}>
                        <TextField size="small" label="작업지시번호" value={workdtNo} disabled />
                    </Grid>
                ) : null}
                {/* 기존 -> 품명 TextField 직접 입력 / 변경 -> 품목 Autocomplete 선택 */}
                <Grid size={12}>
                    <Autocomplete<MaterialOption>
                        options={materialsQuery.data?.items ?? []}
                        value={selectedMaterial}
                        loading={materialsQuery.isFetching}
                        filterOptions={(options) => options}
                        onInputChange={(_, next, reason) => {
                            if (reason === 'input') setMaterialKeyword(next);
                        }}
                        onChange={(_, material) => handleSelectMaterial(material)}
                        getOptionLabel={(option) => option.materialName}
                        isOptionEqualToValue={(option, selected) => option.id === selected.id}
                        noOptionsText="검색된 품목이 없습니다."
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                required
                                size="small"
                                label="품목"
                                error={Boolean(errors.materialId)}
                                helperText={errors.materialId}
                            />
                        )}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    {/* 기존 -> 생산일자 / 변경 -> 생산계획일, 변경 시 소비기한 자동 계산 */}
                    <TextField
                        required
                        size="small"
                        type="date"
                        label="생산계획일"
                        value={value.productionDate}
                        onChange={(event) => handleChangeProductionDate(event.target.value)}
                        error={Boolean(errors.productionDate)}
                        helperText={errors.productionDate}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        required
                        size="small"
                        type="date"
                        label="소비기한"
                        value={value.expiryDate}
                        onChange={(event) => setField('expiryDate', event.target.value)}
                        error={Boolean(errors.expiryDate)}
                        helperText={errors.expiryDate ?? '생산계획일 기준 1년으로 자동 설정됩니다.'}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                        required
                        size="small"
                        type="number"
                        label="생산량"
                        value={value.quantity ?? ''}
                        onChange={(event) =>
                            setField('quantity', event.target.value === '' ? null : Number(event.target.value))
                        }
                        error={Boolean(errors.quantity)}
                        helperText={errors.quantity}
                    />
                </Grid>
                {/* 기존 -> 단위·규격 직접 입력 / 변경 -> 품목 정보에서 가져와 읽기 전용 */}
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField size="small" label="단위" value={getCommonCodeName(unitOptions, value.unit)} disabled />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField size="small" label="규격" value={value.spec} disabled />
                </Grid>
                <Grid size={12}>
                    <TextField
                        size="small"
                        label="비고"
                        multiline
                        minRows={2}
                        value={value.remark}
                        onChange={(event) => setField('remark', event.target.value)}
                        error={Boolean(errors.remark)}
                        helperText={errors.remark}
                    />
                </Grid>
            </Grid>
        </FormDialog>
    );
}