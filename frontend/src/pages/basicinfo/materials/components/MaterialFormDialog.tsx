import { Button, Grid, MenuItem, Stack, TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import { MATERIAL_ITEM_TYPES } from '../../../../services/basicinfo/materialsService';

export type MaterialFormValue = {
  materialName: string;
  itemType: string;
  materialSpec: string;
  materialWeight: string;
  unit: string;
  etc: string;
};

type MaterialFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialValue?: MaterialFormValue;
  materialCode?: string;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (value: MaterialFormValue) => void;
};

const EMPTY_VALUE: MaterialFormValue = {
  materialName: '',
  itemType: '',
  materialSpec: '',
  materialWeight: '',
  unit: '',
  etc: '',
};

export function MaterialFormDialog({
  open,
  mode,
  initialValue,
  materialCode,
  saving,
  onClose,
  onSubmit,
}: MaterialFormDialogProps) {
  const [value, setValue] = useState<MaterialFormValue>(EMPTY_VALUE);

  useEffect(() => {
    if (!open) {
      return;
    }
    setValue(initialValue ?? EMPTY_VALUE);
  }, [open, initialValue]);

  const handleSubmit = () => {
    onSubmit({
      ...value,
      materialName: value.materialName.trim(),
      materialSpec: value.materialSpec.trim(),
      unit: value.unit.trim(),
      etc: value.etc.trim(),
    });
  };

  const disabled = saving || value.materialName.trim().length === 0;

  return (
    <FormDialog
      open={open}
      title={mode === 'create' ? '품목 등록' : '품목 수정'}
      description={
        mode === 'create'
          ? '품목 정보를 입력해 등록합니다. 품목코드는 저장 시 자동으로 채번됩니다.'
          : '품목 정보를 수정하고 저장하세요.'
      }
      onClose={onClose}
      maxWidth="sm"
      actions={
        <>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={disabled}
          >
            저장
          </Button>
          <Button onClick={onClose} disabled={saving}>
            취소
          </Button>
        </>
      }
    >
      <Stack spacing={2} sx={{ mt: 0.5 }}>
        <Grid container spacing={2}>
          {mode === 'edit' ? (
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField
                label="품목코드"
                value={materialCode ?? ''}
                fullWidth
                disabled
              />
            </Grid>
          ) : null}
          <Grid size={{ xs: 12, sm: mode === 'edit' ? 7 : 12 }}>
            <TextField
              label="품목명 *"
              value={value.materialName}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, materialName: e.target.value }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="품목계정"
              value={value.itemType}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, itemType: e.target.value }))
              }
              fullWidth
            >
              <MenuItem value="">
                <em>선택 안 함</em>
              </MenuItem>
              {MATERIAL_ITEM_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="규격"
              value={value.materialSpec}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, materialSpec: e.target.value }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="중량"
              type="number"
              value={value.materialWeight}
              onChange={(e) =>
                setValue((prev) => ({
                  ...prev,
                  materialWeight: e.target.value,
                }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="단위"
              value={value.unit}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, unit: e.target.value }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="비고"
              value={value.etc}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, etc: e.target.value }))
              }
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
        </Grid>
      </Stack>
    </FormDialog>
  );
}
