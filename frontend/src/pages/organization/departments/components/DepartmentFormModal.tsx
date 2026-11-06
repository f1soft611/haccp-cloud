import { Button, Stack, TextField } from '@mui/material';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import type {
  DepartmentItem,
  DepartmentFormData,
} from '../../../../services/organization/departmentsService';

const ACTIVE_OPTIONS = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
] as const;

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

        <AppSelect
          label="상위 부서"
          value={formData.parentId ?? 'none'}
          onChange={(parentId) =>
            onChange({
              ...formData,
              parentId: parentId === 'none' ? null : parentId,
            })
          }
          fullWidth
          options={[
            { value: 'none', label: '없음 (최상위)' },
            ...parentOptions
              .filter((d) => d.id !== editTargetId)
              .map((dept) => ({ value: dept.id, label: dept.name })),
          ]}
        />

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
          <AppSelect
            label="사용여부"
            value={formData.active ? 'Y' : 'N'}
            onChange={(active) =>
              onChange({ ...formData, active: active === 'Y' })
            }
            fullWidth
            options={ACTIVE_OPTIONS}
          />
        )}
      </Stack>
    </FormDialog>
  );
}
