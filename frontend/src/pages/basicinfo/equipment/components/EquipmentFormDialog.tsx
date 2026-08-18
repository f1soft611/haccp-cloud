import {
  Button,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';

export type EquipmentFormValue = {
  equipCd: string;
  equipNm: string;
  equipKind: string;
  purDate: string;
  purCust: string;
  makCust: string;
  equipSpec: string;
  location: string;
  bigo: string;
  active: boolean;
};

type EquipmentFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  initialValue?: EquipmentFormValue;
  equipSysCd?: string;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (value: EquipmentFormValue) => void;
};

const EMPTY_VALUE: EquipmentFormValue = {
  equipCd: '',
  equipNm: '',
  equipKind: '',
  purDate: '',
  purCust: '',
  makCust: '',
  equipSpec: '',
  location: '',
  bigo: '',
  active: true,
};

export function EquipmentFormDialog({
  open,
  mode,
  initialValue,
  equipSysCd,
  saving,
  onClose,
  onSubmit,
}: EquipmentFormDialogProps) {
  const [value, setValue] = useState<EquipmentFormValue>(EMPTY_VALUE);

  useEffect(() => {
    if (!open) {
      return;
    }
    setValue(initialValue ?? EMPTY_VALUE);
  }, [open, initialValue]);

  const handleSubmit = () => {
    onSubmit({
      ...value,
      equipCd: value.equipCd.trim(),
      equipNm: value.equipNm.trim(),
      equipKind: value.equipKind.trim(),
      purCust: value.purCust.trim(),
      makCust: value.makCust.trim(),
      equipSpec: value.equipSpec.trim(),
      location: value.location.trim(),
      bigo: value.bigo.trim(),
    });
  };

  const disabled =
    saving ||
    value.equipCd.trim().length === 0 ||
    value.equipNm.trim().length === 0;

  return (
    <FormDialog
      open={open}
      title={mode === 'create' ? '설비 등록' : '설비 수정'}
      description={
        mode === 'create'
          ? '설비 정보를 입력해 등록합니다. 관리코드는 저장 시 자동으로 채번됩니다.'
          : '설비 정보를 수정하고 저장하세요.'
      }
      onClose={onClose}
      maxWidth="md"
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
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                label="관리코드"
                value={equipSysCd ?? ''}
                fullWidth
                disabled
              />
            </Grid>
          ) : null}
          <Grid size={{ xs: 12, sm: mode === 'edit' ? 8 : 6 }}>
            <TextField
              label="설비코드 *"
              value={value.equipCd}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, equipCd: e.target.value }))
              }
              slotProps={{ htmlInput: { maxLength: 20 } }}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: mode === 'edit' ? 12 : 6 }}>
            <TextField
              label="설비명 *"
              value={value.equipNm}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, equipNm: e.target.value }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="설비종류"
              value={value.equipKind}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, equipKind: e.target.value }))
              }
              helperText="최대 6자"
              slotProps={{ htmlInput: { maxLength: 6 } }}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="구입일"
              type="date"
              value={value.purDate}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, purDate: e.target.value }))
              }
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="구입처"
              value={value.purCust}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, purCust: e.target.value }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="제조사"
              value={value.makCust}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, makCust: e.target.value }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="설비규격"
              value={value.equipSpec}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, equipSpec: e.target.value }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="설치장소"
              value={value.location}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, location: e.target.value }))
              }
              fullWidth
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              label="비고"
              value={value.bigo}
              onChange={(e) =>
                setValue((prev) => ({ ...prev, bigo: e.target.value }))
              }
              fullWidth
              multiline
              rows={2}
            />
          </Grid>
        </Grid>

        <FormControlLabel
          control={
            <Switch
              checked={value.active}
              onChange={(event) =>
                setValue((prev) => ({
                  ...prev,
                  active: event.target.checked,
                }))
              }
            />
          }
          label={value.active ? '사용' : '미사용'}
        />
      </Stack>
    </FormDialog>
  );
}
