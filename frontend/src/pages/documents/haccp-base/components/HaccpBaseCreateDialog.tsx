import { Button, MenuItem, Stack, TextField } from '@mui/material';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import {
  HACCP_CATEGORY_OPTIONS,
  HACCP_CYCLE_OPTIONS,
  type HaccpBaseCreateForm,
} from '../types';

export function HaccpBaseCreateDialog(props: {
  open: boolean;
  value: HaccpBaseCreateForm;
  onClose: () => void;
  onChange: (next: HaccpBaseCreateForm) => void;
  onSubmit: () => void;
}) {
  const { open, value, onClose, onChange, onSubmit } = props;

  const isSubmitDisabled =
    !value.divisionCode.trim() || !value.divisionName.trim();

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="업무 추가"
      description="양식 기본 정보를 등록합니다."
      actions={
        <>
          <Button
            onClick={onSubmit}
            variant="contained"
            disabled={isSubmitDisabled}
          >
            등록
          </Button>
          <Button onClick={onClose}>취소</Button>
        </>
      }
    >
      <Stack spacing={2}>
        <TextField
          label="구분코드"
          value={value.divisionCode}
          onChange={(event) =>
            onChange({
              ...value,
              divisionCode: event.target.value,
            })
          }
          required
          autoFocus
        />

        <TextField
          label="구분명"
          value={value.divisionName}
          onChange={(event) =>
            onChange({
              ...value,
              divisionName: event.target.value,
            })
          }
          required
        />

        <TextField
          select
          label="분류"
          value={value.category}
          onChange={(event) =>
            onChange({
              ...value,
              category: event.target.value as HaccpBaseCreateForm['category'],
            })
          }
        >
          {HACCP_CATEGORY_OPTIONS.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="등록주기"
          value={value.cycle}
          onChange={(event) =>
            onChange({
              ...value,
              cycle: event.target.value as HaccpBaseCreateForm['cycle'],
            })
          }
        >
          {HACCP_CYCLE_OPTIONS.map((cycle) => (
            <MenuItem key={cycle} value={cycle}>
              {cycle}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
    </FormDialog>
  );
}
