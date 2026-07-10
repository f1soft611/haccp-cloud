import { type MouseEvent, useMemo, useState } from 'react';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SecurityRoundedIcon from '@mui/icons-material/SecurityRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import {
  Avatar,
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { logout as logoutApi } from '../../../services/auth/logoutService';
import { useAuthStore } from '../../store/authStore';
import { getRoleLabel } from '../../constants/labels';
import { resolveLoginPathWithLastDomain } from '../../utils/loginDomainRouting';

function resolveAvatarLabel(displayName: string, userId: string): string {
  const visibleName = displayName.trim();
  if (visibleName) {
    return visibleName.slice(0, 1).toUpperCase();
  }

  const visibleUserId = userId.trim();
  if (visibleUserId) {
    return visibleUserId.slice(0, 1).toUpperCase();
  }

  return 'U';
}

export function UserAccountMenu() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const displayName = useAuthStore((state) => state.displayName);
  const userId = useAuthStore((state) => state.userId);
  const role = useAuthStore((state) => state.role);
  const email = useAuthStore((state) => state.email);
  const loginHistoryId = useAuthStore((state) => state.loginHistoryId);
  const clearAuth = useAuthStore((state) => state.logout);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  const visibleName = (displayName ?? '').trim() || userId.trim() || '사용자';
  const visibleEmail = (email ?? '').trim();

  const avatarLabel = useMemo(
    () => resolveAvatarLabel(visibleName, userId),
    [userId, visibleName],
  );

  const handleMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleGoToMyPage = () => {
    handleMenuClose();
    navigate('/account/my-page');
  };

  const handleGoToPassword = () => {
    handleMenuClose();
    navigate('/account/password');
  };

  const handleLogout = async () => {
    handleMenuClose();

    try {
      await logoutApi(loginHistoryId);
    } catch {
      // Force local logout even if backend call fails.
    } finally {
      clearAuth();
      navigate(resolveLoginPathWithLastDomain(), { replace: true });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <IconButton
        onClick={handleMenuOpen}
        aria-label={`${visibleName} 사용자 메뉴`}
        size="small"
        sx={{
          border: '1px solid',
          borderColor: 'rgba(15,23,42,0.18)',
          bgcolor: 'background.paper',
          color: 'text.primary',
          ml: 0.25,
          '&:hover': {
            bgcolor: 'rgba(20,184,166,0.08)',
            borderColor: 'primary.main',
          },
        }}
      >
        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: 'primary.main',
            fontSize: '0.9rem',
            fontWeight: 800,
          }}
        >
          {avatarLabel}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 0.8,
              border: '1px solid rgba(15,23,42,0.14)',
              borderRadius: 2,
              minWidth: 240,
              boxShadow: '0 16px 32px rgba(15,23,42,0.14)',
              p: 0.75,
            },
          },
        }}
      >
        <Box sx={{ px: 1.2, py: 0.8 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar sx={{ width: 42, height: 42, bgcolor: 'primary.main' }}>
              {avatarLabel}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={800} noWrap>
                {visibleName}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {getRoleLabel(role)}
              </Typography>
              {visibleEmail ? (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {visibleEmail}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 0.75 }} />

        <MenuItem onClick={handleGoToMyPage} sx={{ borderRadius: 1.5 }}>
          <ListItemIcon>
            <BadgeRoundedIcon fontSize="small" />
          </ListItemIcon>
          내 정보 관리
          <ListItemIcon sx={{ ml: 'auto', minWidth: 0 }}>
            <ChevronRightRoundedIcon fontSize="small" />
          </ListItemIcon>
        </MenuItem>
        <MenuItem onClick={handleGoToPassword} sx={{ borderRadius: 1.5 }}>
          <ListItemIcon>
            <SecurityRoundedIcon fontSize="small" />
          </ListItemIcon>
          보안 설정
        </MenuItem>
        <MenuItem onClick={handleLogout} sx={{ borderRadius: 1.5 }}>
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          로그아웃
        </MenuItem>
      </Menu>
    </>
  );
}
