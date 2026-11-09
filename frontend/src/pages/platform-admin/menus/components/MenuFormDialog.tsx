import { Button, Stack } from '@mui/material';
import { AppTextField } from '../../../../shared/components/forms/AppTextField';
import { AppSelect } from '../../../../shared/components/forms/AppSelect';
import { FormDialog } from '../../../../shared/components/forms/FormDialog';
import { ICON_OPTIONS } from './MenuGrid';

const USE_AT_OPTIONS = [
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
] as const;

export type MenuFormData = {
  menuCode: string;
  menuNm: string;
  menuDc: string;
  menuUrl: string;
  parentMenuId: string | null;
  menuOrdr: number;
  iconNm: string;
  useAt: 'Y' | 'N';
};

export function MenuFormDialog(props: {
  open: boolean;
  isEdit: boolean;
  formData: MenuFormData;
  parentMenuOptions: { menuId: string; menuNm: string }[];
  submitting?: boolean;
  canManage?: boolean;
  onClose: () => void;
  onChange: (next: MenuFormData) => void;
  onSave: () => void;
}) {
  const {
    open,
    isEdit,
    formData,
    parentMenuOptions,
    submitting = false,
    canManage = false,
    onClose,
    onChange,
    onSave,
  } = props;

  const isRootMenu = formData.parentMenuId == null;
  const isSaveDisabled =
    !canManage ||
    !formData.menuNm.trim() ||
    (!isRootMenu && !formData.menuUrl.trim()) ||
    submitting;

  const description = isEdit
    ? '메뉴 정보를 수정하고 저장하면 즉시 목록에 반영됩니다.'
    : '새 메뉴를 등록해 플랫폼 화면과 권한 설정에 연결할 수 있습니다.';

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={isEdit ? '메뉴 수정' : '메뉴 추가'}
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
        <AppTextField
          label="메뉴코드"
          value={formData.menuCode}
          onChange={(nextValue) =>
            onChange({ ...formData, menuCode: nextValue.toUpperCase() })
          }
          fullWidth
          required
          disabled={isEdit}
          helperText={
            isEdit
              ? '메뉴코드는 생성 후 수정할 수 없습니다.'
              : '예: MENU_PLATFORM_REPORTS (미입력 시 자동 생성)'
          }
        />
        <AppTextField
          label="메뉴명 *"
          value={formData.menuNm}
          onChange={(menuNm) => onChange({ ...formData, menuNm })}
          fullWidth
          required
        />
        <AppTextField
          label="메뉴 설명"
          value={formData.menuDc}
          onChange={(menuDc) => onChange({ ...formData, menuDc })}
          fullWidth
          multiline
          rows={2}
        />
        <AppSelect
          label="상위 메뉴"
          value={formData.parentMenuId ?? 'none'}
          onChange={(parentMenuId) =>
            onChange({
              ...formData,
              parentMenuId: parentMenuId === 'none' ? null : parentMenuId,
            })
          }
          fullWidth
          options={[
            { value: 'none', label: '없음 (루트)' },
            ...parentMenuOptions.map((menu) => ({
              value: menu.menuId,
              label: menu.menuNm,
            })),
          ]}
        />
        <AppTextField
          label={isRootMenu ? '메뉴 URL' : '메뉴 URL *'}
          value={formData.menuUrl}
          onChange={(menuUrl) => onChange({ ...formData, menuUrl })}
          fullWidth
          required={!isRootMenu}
          placeholder={
            isRootMenu ? '선택 사항 (예: /platform)' : '/platform/menus'
          }
        />
        <AppTextField
          label="순서"
          type="number"
          value={formData.menuOrdr}
          onChange={(nextValue) =>
            onChange({ ...formData, menuOrdr: Number(nextValue) || 0 })
          }
          fullWidth
        />
        <AppSelect
          label="아이콘"
          value={formData.iconNm}
          onChange={(iconNm) => onChange({ ...formData, iconNm })}
          fullWidth
          options={ICON_OPTIONS.map((icon) => ({ value: icon, label: icon }))}
        />
        <AppSelect
          label="사용여부"
          value={formData.useAt}
          onChange={(useAt) => onChange({ ...formData, useAt })}
          fullWidth
          options={USE_AT_OPTIONS}
        />
      </Stack>
    </FormDialog>
  );
}
