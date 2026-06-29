import { Button, MenuItem, Select, Stack, TextField } from '@mui/material';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';

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
  const canSubmit = isCreateMode
    ? value.code.trim().length > 0 && value.name.trim().length > 0
    : value.name.trim().length > 0;

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
          <Select
            value={value.useAt}
            onChange={(event) =>
              onChange({
                ...value,
                useAt: event.target.value as 'Y' | 'N',
              })
            }
            size="small"
            sx={{ minWidth: 120, mr: 'auto' }}
          >
            <MenuItem value="Y">활성</MenuItem>
            <MenuItem value="N">비활성</MenuItem>
          </Select>
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={!canSubmit || saving}
          >
            {submitLabel}
          </Button>
          <Button onClick={onClose}>취소</Button>
        </>
      }
    >
      <Stack spacing={2}>
        <TextField
          value={value.code}
          onChange={(event) =>
            onChange({
              ...value,
              code: event.target.value.toUpperCase(),
            })
          }
          label="권한 코드 *"
          placeholder="ROLE_QA_MANAGER"
          size="small"
          required
          disabled={!isCreateMode}
          fullWidth
        />
        <TextField
          value={value.name}
          onChange={(event) =>
            onChange({
              ...value,
              name: event.target.value,
            })
          }
          label="권한명 *"
          size="small"
          required
          fullWidth
        />
        <TextField
          value={value.description}
          onChange={(event) =>
            onChange({
              ...value,
              description: event.target.value,
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
