import { Box, Button, Stack } from '@mui/material';
import { NavLink } from 'react-router-dom';
import type { UserRole } from '../store/authStore';

type MenuItem = {
  label: string;
  path: string;
  roles: UserRole[];
};

type WorkMenuBarProps = {
  menuItems: MenuItem[];
  role: UserRole;
};

export function WorkMenuBar({ menuItems, role }: WorkMenuBarProps) {
  return (
    <Box
      data-testid="work-menu-bar"
      sx={{
        px: { xs: 1.25, md: 2.5 },
        py: 1.1,
        borderBottom: '1px solid',
        borderColor: 'rgba(31,79,143,0.18)',
        bgcolor: '#eef4fb',
      }}
    >
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ overflowX: 'auto', alignItems: 'center' }}
      >
        {menuItems
          .filter((item) => item.roles.includes(role))
          .map((item) => (
            <Button
              key={item.path}
              component={NavLink}
              to={item.path}
              color="primary"
              variant="text"
              sx={{
                flexShrink: 0,
                fontWeight: 800,
                px: 1.8,
                py: 0.85,
                borderRadius: 1.5,
                color: 'text.secondary',
                border: '1px solid transparent',
                letterSpacing: 0.2,
                '&.active': {
                  color: 'primary.dark',
                  bgcolor: 'common.white',
                  borderColor: 'rgba(31,79,143,0.25)',
                  boxShadow: '0 6px 14px rgba(31,79,143,0.12)',
                },
              }}
            >
              {item.label}
            </Button>
          ))}
      </Stack>
    </Box>
  );
}
