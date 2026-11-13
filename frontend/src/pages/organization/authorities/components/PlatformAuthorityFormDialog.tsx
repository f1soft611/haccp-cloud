import { Button, Stack } from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import {CancelButton} from "../../../../shared/components/forms/CancelButton.tsx";

const USE_AT_OPTIONS = [
  { value: 'Y', label: '활성' },
  { value: 'N', label: '비활성' },
] as const;

export type PlatformAuthorityFormValue = {
  code: string;
  name: string;
  description: string;
  useAt: 'Y' | 'N';
};

export function PlatformAuthorityFormDialog(props: {
  open: boolean;
  mode: 'create' | 'edit';
  value: PlatformAuthorityFormValue;
  saving?: boolean;
  onChange: (next: PlatformAuthorityFormValue) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  const {
    open,
    mode,
    value,
    saving = false,
    onChange,
    onSubmit,
    onClose,
  } = props;
  const isCreateMode = mode === 'create';
  const title = isCreateMode ? '권한 추가' : '권한 수정';
  const description = isCreateMode
    ? '새 권한을 등록하면 메뉴 매핑 모달에서 메뉴 접근 권한을 연결할 수 있습니다.'
    : '권한 정보를 수정하고 저장하세요.';
  const submitLabel = isCreateMode ? '등록' : '저장';
  const canSubmit = value.name.trim().length > 0;

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      title={title}
      description={description}
      contentSx={{
        '& .MuiStack-root': {
          width: '100%',
        },
      }}
      actions={
        <>
          <AppSelect
            size="small"
            value={value.useAt}
            onChange={(useAt) => onChange({ ...value, useAt })}
            options={USE_AT_OPTIONS}
            selectProps={{ SelectDisplayProps: { 'aria-label': '활성 상태' } }}
            sx={{ minWidth: 120, mr: 'auto' }}
          />
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={!canSubmit || saving}
          >
            {submitLabel}
          </Button>
          <CancelButton onClick={onClose} />
        </>
      }
    >
      <Stack spacing={2}>
        <AppTextField
          value={value.code}
          label="권한 코드"
          helperText={isCreateMode ? '저장 시 자동 채번됩니다 (001부터)' : undefined}
          size="small"
          disabled
          fullWidth
        />
        <AppTextField
          value={value.name}
          onChange={(name) =>
            onChange({
              ...value,
              name,
            })
          }
          label="권한명 *"
          size="small"
          required
          fullWidth
        />
        <AppTextField
          value={value.description}
          onChange={(description) =>
            onChange({
              ...value,
              description,
            })
          }
          label="설명"
          size="small"
          multiline
          minRows={3}
          fullWidth
        />
      </Stack>
    </FormDialog>
  );
}
