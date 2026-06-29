import {
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
} from '@mui/material';
import { APP_LABELS } from '../../../../shared/constants/labels';

export function RoleMenuMappingPanel(props: {
  roles: { id: string; code: string; name: string }[];
  menus: { menuId: string; menuNm: string; menuUrl: string }[];
  selectedRoleCode: string;
  selectedMenuIds: string[];
  submitting?: boolean;
  onSelectRole: (code: string) => void;
  onToggleMenu: (menuId: string) => void;
  onSave: () => void;
}) {
  const {
    roles,
    menus,
    selectedRoleCode,
    selectedMenuIds,
    submitting = false,
    onSelectRole,
    onToggleMenu,
    onSave,
  } = props;

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 1.5 }}>
        {roles.map((role) => (
          <Button
            key={role.id}
            variant={selectedRoleCode === role.code ? 'contained' : 'outlined'}
            size="small"
            onClick={() => onSelectRole(role.code)}
          >
            {role.name}
          </Button>
        ))}
      </Stack>

      <Stack spacing={0.5}>
        {menus.map((menu) => (
          <FormControlLabel
            key={menu.menuId}
            control={
              <Checkbox
                checked={selectedMenuIds.includes(menu.menuId)}
                onChange={() => onToggleMenu(menu.menuId)}
              />
            }
            label={`${menu.menuNm} (${menu.menuUrl})`}
          />
        ))}
      </Stack>

      <Button
        variant="contained"
        sx={{ mt: 1.5 }}
        onClick={onSave}
        disabled={submitting || !selectedRoleCode}
      >
        {APP_LABELS.action.save}
      </Button>
    </Paper>
  );
}
