import {
  Button,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';

export type UserFormValue = {
  name: string;
  email: string;
  department: string;
  roleCode: string;
  active: boolean;
};

type UserFormDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  departmentOptions: string[];
  roleOptions: Array<{ code: string; name: string }>;
  initialValue?: UserFormValue;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (value: UserFormValue) => void;
};

const EMPTY_VALUE: UserFormValue = {
  name: '',
  email: '',
  department: '',
  roleCode: 'TENANT_USER',
  active: true,
};

export function UserFormDialog({
  open,
  mode,
  departmentOptions,
  roleOptions,
  initialValue,
  saving,
  onClose,
  onSubmit,
}: UserFormDialogProps) {
  const [value, setValue] = useState<UserFormValue>(EMPTY_VALUE);

  const normalizedRoleOptions = useMemo(() => {
    if (roleOptions.length > 0) {
      return roleOptions;
    }

    return [
      { code: 'TENANT_ADMIN', name: '업체 관리자' },
      { code: 'TENANT_USER', name: '업체 사용자' },
    ];
  }, [roleOptions]);

  const normalizedDepartmentOptions = useMemo(() => {
    const merged = [
      ...departmentOptions,
      ...(initialValue?.department ? [initialValue.department] : []),
    ];

    return Array.from(
      new Set(
        merged
          .map((item) => String(item ?? '').trim())
          .filter((item) => item.length > 0),
      ),
    );
  }, [departmentOptions, initialValue?.department]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initialValue) {
      setValue(initialValue);
      return;
    }

    setValue({
      ...EMPTY_VALUE,
      roleCode: normalizedRoleOptions[0]?.code || EMPTY_VALUE.roleCode,
    });
  }, [open, initialValue, normalizedRoleOptions]);

  const handleSubmit = () => {
    onSubmit({
      name: value.name.trim(),
      email: value.email.trim(),
      department: value.department.trim(),
      roleCode: value.roleCode,
      active: value.active,
    });
  };

  const disabled =
    saving ||
    value.name.trim().length === 0 ||
    value.email.trim().length === 0 ||
    value.department.trim().length === 0 ||
    value.roleCode.trim().length === 0;

  return (
    <FormDialog
      open={open}
      title={mode === 'create' ? '사용자 등록' : '사용자 수정'}
      description={
        mode === 'create'
          ? '사용자 계정과 권한, 활성 상태를 함께 등록합니다.'
          : '사용자 정보를 수정하고 저장하세요.'
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
        <TextField
          label="이름"
          value={value.name}
          onChange={(event) =>
            setValue((prev) => ({ ...prev, name: event.target.value }))
          }
          fullWidth
        />
        <TextField
          label="이메일"
          value={value.email}
          onChange={(event) =>
            setValue((prev) => ({ ...prev, email: event.target.value }))
          }
          fullWidth
        />
        <TextField
          select
          label="부서"
          value={value.department}
          onChange={(event) =>
            setValue((prev) => ({ ...prev, department: event.target.value }))
          }
          fullWidth
        >
          {normalizedDepartmentOptions.map((departmentName) => (
            <MenuItem key={departmentName} value={departmentName}>
              {departmentName}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="권한"
          value={value.roleCode}
          onChange={(event) =>
            setValue((prev) => ({ ...prev, roleCode: event.target.value }))
          }
          fullWidth
        >
          {normalizedRoleOptions.map((role) => (
            <MenuItem key={role.code} value={role.code}>
              {role.name}
            </MenuItem>
          ))}
        </TextField>

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
          label={value.active ? '활성(로그인 허용)' : '비활성(로그인 차단)'}
        />
      </Stack>
    </FormDialog>
  );
}
