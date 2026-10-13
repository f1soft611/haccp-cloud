import { Button, Grid, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import type { WorkOrderFormValue } from '../types';
import { validateWorkOrderForm, type WorkOrderFormErrors } from '../workOrderRows';

const EMPTY_VALUE: WorkOrderFormValue = {
    itemName: '',
    productionDate: '',
    expiryDate: '',
    quantity: null,
    unit: '',
    spec: '',
    remark: '',
};

export function WorkOrderFormDialog(props: {
    open: boolean;
    mode: 'create' | 'edit';
    initialValue?: WorkOrderFormValue;
    onClose: () => void;
    onSubmit: (value: WorkOrderFormValue) => void;
}) {
    const { open, mode, initialValue, onClose, onSubmit } = props;
    const [value, setValue] = useState<WorkOrderFormValue>(EMPTY_VALUE);
    const [errors, setErrors] = useState<WorkOrderFormErrors>({});

    useEffect(() => {
        if (!open) return;
        setValue(initialValue ?? EMPTY_VALUE);
        setErrors({});
    }, [open, initialValue]);

    const setField = <K extends keyof WorkOrderFormValue>(field: K, next: WorkOrderFormValue[K]) =>
        setValue((prev) => ({ ...prev, [field]: next }));

    const handleSubmit = () => {
        const nextErrors = validateWorkOrderForm(value);
        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) return;
        onSubmit({ ...value, itemName: value.itemName.trim() });
    };

    return (
        <FormDialog
            open={open}
            title={mode === 'create' ? '작업지시 등록' : '작업지시 수정'}
            onClose={onClose}
            actions={
                <>
                    <Button variant="outlined" onClick={onClose}>
                        취소
                    </Button>
                    <Button variant="contained" onClick={handleSubmit}>
                        저장
                    </Button>
                </>
            }
        >
            <Grid container spacing={2}>
                <Grid size={12}>
                    <TextField
                        required
                        size="small"
                        label="품명"
                        value={value.itemName}
                        onChange={(event) => setField('itemName', event.target.value)}
                        error={Boolean(errors.itemName)}
                        helperText={errors.itemName}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        required
                        size="small"
                        type="date"
                        label="생산일자"
                        value={value.productionDate}
                        onChange={(event) => setField('productionDate', event.target.value)}
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
                        helperText={errors.expiryDate}
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
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                        size="small"
                        label="단위"
                        value={value.unit}
                        onChange={(event) => setField('unit', event.target.value)}
                    />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                        size="small"
                        label="규격"
                        value={value.spec}
                        onChange={(event) => setField('spec', event.target.value)}
                    />
                </Grid>
                <Grid size={12}>
                    <TextField
                        size="small"
                        label="비고"
                        multiline
                        minRows={2}
                        value={value.remark}
                        onChange={(event) => setField('remark', event.target.value)}
                    />
                </Grid>
            </Grid>
        </FormDialog>
    );
}