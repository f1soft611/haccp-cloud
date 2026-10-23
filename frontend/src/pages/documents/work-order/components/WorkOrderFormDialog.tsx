import SearchIcon from '@mui/icons-material/Search';
import { Button, Grid, InputAdornment, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import type { MaterialItem } from '../../../../services/basicinfo/materialsService';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import type { WorkOrderFormValue } from '../types';
import {
    calcExpiryDate,
    validateWorkOrderForm,
    type WorkOrderFormErrors,
} from '../workOrderRows';
import { COMMON_CODE_GROUP } from '../../../../shared/constants/commonCodeGroups';
import {
    getCommonCodeName,
    useCommonCodeOptions,
} from '../../../../shared/hooks/useCommonCodeOptions';
import { MaterialSelectDialog } from './MaterialSelectDialog';

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
    expiryedStatus: 'NONE',
    expiryedCount: null,
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
    const [value, setValue] = useState<WorkOrderFormValue>(EMPTY_VALUE);
    const [errors, setErrors] = useState<WorkOrderFormErrors>({});
    const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
    const unitOptions = useCommonCodeOptions(COMMON_CODE_GROUP.ITEM_UNIT);
    const expiryStatusOptions = useCommonCodeOptions(COMMON_CODE_GROUP.EXPIRY_STATUS);

    useEffect(() => {
        if (!open) return;
        setValue(initialValue ?? EMPTY_VALUE);
        setErrors({});
        setMaterialDialogOpen(false);
    }, [open, initialValue]);

    const setField = <K extends keyof WorkOrderFormValue>(field: K, next: WorkOrderFormValue[K]) =>
        setValue((prev) => ({ ...prev, [field]: next }));

    const handleSelectMaterial = (material: MaterialItem) => {
        setValue((prev) => ({
            ...prev,
            materialId: material.id,
            itemName: material.materialName,
            unit: material.unit,
            spec: material.materialSpec,
            expiryedStatus: material.expiryedStatus,
            expiryedCount: material.expiryedCount,
            expiryDate: prev.productionDate
                ? calcExpiryDate(prev.productionDate, material.expiryedStatus, material.expiryedCount)
                : prev.expiryDate,
        }));
        setMaterialDialogOpen(false);
    };

    // 선택한 품목의 소비기한 기준으로 다시 채움. 이후 직접 수정 가능
    const handleChangeProductionDate = (productionDate: string) =>
        setValue((prev) => ({
            ...prev,
            productionDate,
            expiryDate: calcExpiryDate(productionDate, prev.expiryedStatus, prev.expiryedCount),
        }));

    const expiryHelperText = !value.materialId
        ? '품목의 소비기한 기준으로 자동 설정됩니다.'
        : value.expiryedStatus !== 'NONE' && value.expiryedCount
            ? `품목 소비기한(${value.expiryedCount}${getCommonCodeName(expiryStatusOptions, value.expiryedStatus)}) 기준으로 자동 설정됩니다.`
            : '품목에 소비기한 기준이 없어 생산계획일 기준 1년으로 설정됩니다.';

    const handleSubmit = () => {
        const nextErrors = validateWorkOrderForm(value);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSubmit({ ...value, remark: value.remark.trim() });
    };

    return (
        <>
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
                        <TextField
                            required
                            size="small"
                            label="품목"
                            placeholder="클릭하여 품목을 선택하세요"
                            value={value.itemName}
                            onClick={() => setMaterialDialogOpen(true)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') setMaterialDialogOpen(true);
                            }}
                            error={Boolean(errors.materialId)}
                            helperText={errors.materialId}
                            slotProps={{
                                input: {
                                    readOnly: true,
                                    sx: { cursor: 'pointer' },
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                },
                            }}
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
                            helperText={errors.expiryDate ?? expiryHelperText}
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

            <MaterialSelectDialog
                open={materialDialogOpen}
                selectedId={value.materialId}
                onClose={() => setMaterialDialogOpen(false)}
                onSelect={handleSelectMaterial}
            />
        </>

    );
}