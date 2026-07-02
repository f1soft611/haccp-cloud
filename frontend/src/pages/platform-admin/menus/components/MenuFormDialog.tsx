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
import { ICON_OPTIONS } from './MenuGrid';

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
        <TextField
          label="메뉴코드"
          value={formData.menuCode}
          onChange={(e) =>
            onChange({ ...formData, menuCode: e.target.value.toUpperCase() })
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
        <TextField
          label="메뉴명 *"
          value={formData.menuNm}
          onChange={(e) => onChange({ ...formData, menuNm: e.target.value })}
          fullWidth
          required
        />
        <TextField
          label="메뉴 설명"
          value={formData.menuDc}
          onChange={(e) => onChange({ ...formData, menuDc: e.target.value })}
          fullWidth
          multiline
          rows={2}
        />
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            상위 메뉴
          </Typography>
          <Select
            value={formData.parentMenuId ?? 'none'}
            onChange={(e) =>
              onChange({
                ...formData,
                parentMenuId: e.target.value === 'none' ? null : e.target.value,
              })
            }
            fullWidth
          >
            <MenuItem value="none">없음 (루트)</MenuItem>
            {parentMenuOptions.map((menu) => (
              <MenuItem key={menu.menuId} value={menu.menuId}>
                {menu.menuNm}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <TextField
          label={isRootMenu ? '메뉴 URL' : '메뉴 URL *'}
          value={formData.menuUrl}
          onChange={(e) => onChange({ ...formData, menuUrl: e.target.value })}
          fullWidth
          required={!isRootMenu}
          placeholder={
            isRootMenu ? '선택 사항 (예: /platform)' : '/platform/menus'
          }
        />
        <TextField
          label="순서"
          type="number"
          value={formData.menuOrdr}
          onChange={(e) =>
            onChange({ ...formData, menuOrdr: Number(e.target.value) || 0 })
          }
          fullWidth
        />
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            아이콘
          </Typography>
          <Select
            value={formData.iconNm}
            onChange={(e) => onChange({ ...formData, iconNm: e.target.value })}
            fullWidth
          >
            {ICON_OPTIONS.map((icon) => (
              <MenuItem key={icon} value={icon}>
                {icon}
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            사용여부
          </Typography>
          <Select
            value={formData.useAt}
            onChange={(e) =>
              onChange({ ...formData, useAt: e.target.value as 'Y' | 'N' })
            }
            fullWidth
          >
            <MenuItem value="Y">사용</MenuItem>
            <MenuItem value="N">미사용</MenuItem>
          </Select>
        </Box>
      </Stack>
    </FormDialog>
  );
}
