import {
  Box,
  Button,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import type {
  DepartmentItem,
  DepartmentFormData,
} from '../../../../services/organization/departmentsService';

export function DepartmentFormModal(props: {
  open: boolean;
  isEdit: boolean;
  formData: DepartmentFormData;
  parentOptions: Pick<DepartmentItem, 'id' | 'name'>[];
  editTargetId?: string;
  submitting?: boolean;
  onClose: () => void;
  onChange: (next: DepartmentFormData) => void;
  onSave: () => void;
}) {
  const {
    open,
    isEdit,
    formData,
    parentOptions,
    editTargetId,
    submitting = false,
    onClose,
    onChange,
    onSave,
  } = props;

  const isSaveDisabled = !formData.name.trim() || submitting;

  const description = isEdit
    ? '부서 정보를 수정하고 저장하면 즉시 목록에 반영됩니다.'
    : '새 부서를 등록합니다. 상위 부서를 선택하면 하위 부서로 등록됩니다.';

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? '부서 수정' : '부서 추가'}
      description={description}
      actions={
        <>
          <Button
            onClick={onSave}
            variant="contained"
            disabled={isSaveDisabled}
          >
            {isEdit ? '저장' : '추가'}
          </Button>
          <Button onClick={onClose}>취소</Button>
        </>
      }
    >
      <Stack spacing={2}>
        <TextField
          label="부서명 *"
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          fullWidth
          required
          autoFocus
        />

        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            상위 부서
          </Typography>
          <Select
            value={formData.parentId ?? 'none'}
            onChange={(e) =>
              onChange({
                ...formData,
                parentId: e.target.value === 'none' ? null : e.target.value,
              })
            }
            fullWidth
          >
            <MenuItem value="none">없음 (최상위)</MenuItem>
            {parentOptions
              .filter((d) => d.id !== editTargetId)
              .map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
          </Select>
        </Box>

        <TextField
          label="순서"
          type="number"
          value={formData.sortOrder}
          onChange={(e) =>
            onChange({ ...formData, sortOrder: Number(e.target.value) || 0 })
          }
          fullWidth
          inputProps={{ min: 0 }}
        />

        {isEdit && (
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5 }}>
              사용여부
            </Typography>
            <Select
              value={formData.active ? 'Y' : 'N'}
              onChange={(e) =>
                onChange({ ...formData, active: e.target.value === 'Y' })
              }
              fullWidth
            >
              <MenuItem value="Y">사용</MenuItem>
              <MenuItem value="N">미사용</MenuItem>
            </Select>
          </Box>
        )}
      </Stack>
    </FormDialog>
  );
}
