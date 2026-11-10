import { type MouseEvent, useMemo, useState } from 'react';
import { ChevronRight, IdCard, LogOut, Shield } from 'lucide-react';
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
import { resolveLoginPathWithLastTenantNo } from '../../utils/loginDomainRouting';
import styles from '../sharedComponents.module.css';
import { useSharedScope } from '../useSharedScope';

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
  const scope = useSharedScope();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const displayName = useAuthStore((state) => state.displayName);
  const userId = useAuthStore((state) => state.userId);
  const profileImage = useAuthStore((state) => state.profileImage);
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
      navigate(resolveLoginPathWithLastTenantNo(), { replace: true });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <IconButton
          {...scope}
          className={`${scope.className} ${styles.accountTrigger}`}
          onClick={handleMenuOpen}
          aria-label={`${visibleName} 사용자 메뉴`}
          size="small"
      >
        <Avatar
          src={profileImage || undefined}
          className={`${styles.accountAvatar} ${styles.accountAvatarHeader}`}
          data-has-image={Boolean(profileImage)}
          imgProps={{
            style: {
              objectFit: 'cover',
            },
          }}
        >
          {avatarLabel}
        </Avatar>
      </IconButton>

      <Menu
        {...scope}
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { elevation: 0, className: styles.accountMenuPaper } }}
      >
        <Box className={styles.accountProfile}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              src={profileImage || undefined}
              className={`${styles.accountAvatar} ${styles.accountAvatarLarge}`}
              data-has-image={Boolean(profileImage)}
              imgProps={{
                style: {
                  objectFit: 'cover',
                },
              }}
            >
              {avatarLabel}
            </Avatar>
            <Box className={styles.accountProfileText}>
              <Typography variant="subtitle1" className={styles.accountName} noWrap>
                {visibleName}
              </Typography>
              <Typography variant="body2" className={styles.textSecondary} noWrap>
                {getRoleLabel(role)}
              </Typography>
              {visibleEmail ? (
                <Typography variant="caption" className={styles.textSecondary} noWrap>
                  {visibleEmail}
                </Typography>
              ) : null}
            </Box>
          </Stack>
        </Box>

        <Divider className={styles.accountDivider} />

        <MenuItem onClick={handleGoToMyPage} className={styles.accountMenuItem}>
          <ListItemIcon>
            <IdCard />
          </ListItemIcon>
          내 정보 관리
          <ListItemIcon className={styles.accountMenuEndIcon}>
            <ChevronRight />
          </ListItemIcon>
        </MenuItem>
        <MenuItem onClick={handleGoToPassword} className={styles.accountMenuItem}>
          <ListItemIcon>
            <Shield />
          </ListItemIcon>
          보안 설정
        </MenuItem>
        <MenuItem onClick={handleLogout} className={styles.accountMenuItem}>
          <ListItemIcon>
            <LogOut />
          </ListItemIcon>
          로그아웃
        </MenuItem>
      </Menu>
    </>
  );
}
