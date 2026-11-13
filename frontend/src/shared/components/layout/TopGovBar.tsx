import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    IconButton,
    Link,
    Menu,
    MenuItem,
    Stack,
    Typography,
} from '@mui/material';
import { ChevronDown, Menu as MenuIcon, RotateCcw, Search } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useAuthStore } from '../../store/authStore';
import { APP_LABELS } from '../../constants/labels';
import {
    getStoredThemeMode,
    storeThemeMode,
    type ThemeModePreference,
} from '../../theme/themePreference';
import { UserAccountMenu } from '../account/UserAccountMenu';
import styles from '../sharedComponents.module.css';
import { useSharedScope } from '../useSharedScope';

const ROOT_FONT_SIZE_PX = 16;
const FONT_SIZE_STORAGE_KEY = 'haccp-ui-font-size';

const FONT_SIZE_OPTIONS = [
  { key: 'SMALL', label: '작게', scale: 0.9375 },
  { key: 'NORMAL', label: '보통', scale: 1 },
  { key: 'MEDIUM', label: '조금 크게', scale: 1.0625 },
  { key: 'LARGE', label: '크게', scale: 1.125 },
  { key: 'XLARGE', label: '가장 크게', scale: 1.1875 },
] as const;

type FontSizeOptionKey = (typeof FONT_SIZE_OPTIONS)[number]['key'];

const isFontSizeOptionKey = (value: string): value is FontSizeOptionKey =>
  FONT_SIZE_OPTIONS.some((option) => option.key === value);

type TopGovBarProps = {
    onOpenMobileNav?: () => void;
};

export function TopGovBar({ onOpenMobileNav }: TopGovBarProps = {}) {
  const theme = useTheme();
  const scope = useSharedScope();
  // eslint-disable-next-line no-restricted-syntax -- 테마 전환 effect 의존성 (색 아님)
  const isDarkMode = theme.palette.mode === 'dark';
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userId = useAuthStore((state) => state.userId);
  const themeStorageUserId = isAuthenticated ? userId : undefined;
  const [fontSizeMenuAnchor, setFontSizeMenuAnchor] =
    useState<null | HTMLElement>(null);
  const [themeMenuAnchor, setThemeMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [selectedFontSizeKey, setSelectedFontSizeKey] =
    useState<FontSizeOptionKey>(() => {
      if (typeof window === 'undefined') {
        return 'NORMAL';
      }

      const savedValue = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY);
      if (savedValue && isFontSizeOptionKey(savedValue)) {
        return savedValue;
      }

      return 'NORMAL';
    });
  const [selectedThemeMode, setSelectedThemeMode] =
    useState<ThemeModePreference>(
      () => getStoredThemeMode(themeStorageUserId) ?? 'light',
    );

  const selectedFontSize = useMemo(
    () =>
      FONT_SIZE_OPTIONS.find((option) => option.key === selectedFontSizeKey) ??
      FONT_SIZE_OPTIONS[1],
    [selectedFontSizeKey],
  );

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    const rootFontSize = ROOT_FONT_SIZE_PX * selectedFontSize.scale;
    document.documentElement.style.fontSize = `${rootFontSize}px`;
    window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, selectedFontSize.key);
  }, [selectedFontSize]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedThemeMode(getStoredThemeMode(themeStorageUserId) ?? 'light');
  }, [themeStorageUserId, isDarkMode]);

  const handleFontSizeMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setFontSizeMenuAnchor(event.currentTarget);
  };

  const handleThemeMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setThemeMenuAnchor(event.currentTarget);
  };

  const handleFontSizeMenuClose = () => {
    setFontSizeMenuAnchor(null);
  };

  const handleThemeMenuClose = () => {
    setThemeMenuAnchor(null);
  };

  const handleFontSizeSelect = (fontSizeKey: FontSizeOptionKey) => {
    setSelectedFontSizeKey(fontSizeKey);
    handleFontSizeMenuClose();
  };

  const handleFontSizeReset = () => {
    setSelectedFontSizeKey('NORMAL');
    handleFontSizeMenuClose();
  };

  const handleThemeModeSelect = (mode: ThemeModePreference) => {
    setSelectedThemeMode(mode);
    storeThemeMode(themeStorageUserId, mode);
    handleThemeMenuClose();
  };

    return (
        <Box
            {...scope}
            className={`${scope.className} ${styles.topGov}`}
            data-testid="top-gov-bar"
        >
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                className={styles.topGovRow}
            >
                {onOpenMobileNav ? (
                    <IconButton
                        aria-label="메뉴 열기"
                        onClick={onOpenMobileNav}
                        className={styles.topGovMobileNav}
                    >
                        <MenuIcon />
                    </IconButton>
                ) : null}

                <Box className={styles.topGovLogoBox}>
                    <Link
                        component={RouterLink}
                        to="/"
                        underline="none"
                        aria-label="FoodLink 홈으로 이동"
                        className={styles.topGovLogoLink}
                    >
                        <Box
                            component="img"
                            src="/f1foodlink_wh.png"
                            alt="FoodLink"
                            className={styles.topGovLogo}
                        />
                    </Link>
                </Box>

                <Typography
                    variant="caption"
                    className={styles.topGovNotice}
                >
                    {APP_LABELS.header.govNotice}
                </Typography>

                <Stack
                    direction="row"
                    alignItems="center"
                    className={styles.topGovActions}
                >
                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<Search />}
                        aria-label={APP_LABELS.header.searchAction}
                        className={`${styles.topGovButton} ${styles.topGovButtonHidden}`}
                    >
                        {APP_LABELS.header.searchAction}
                    </Button>

                    <Button
                        variant="outlined"
                        color="inherit"
                        aria-label="테마"
                        onClick={handleThemeMenuOpen}
                        endIcon={<ChevronDown />}
                        className={`${styles.topGovButton} ${styles.topGovDropdownButton}`}
                    >
                        테마
                    </Button>

                    <Button
                        variant="outlined"
                        color="inherit"
                        aria-label={APP_LABELS.header.fontSizeAction}
                        onClick={handleFontSizeMenuOpen}
                        endIcon={<ChevronDown />}
                        className={`${styles.topGovButton} ${styles.topGovDropdownButton}`}
                    >
                        {APP_LABELS.header.fontSizeAction}
                    </Button>

                    <Button
                        component="a"
                        href="/manual/index.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        color="inherit"
                        aria-label={APP_LABELS.header.manualAction}
                        className={styles.topGovButton}
                    >
                        {APP_LABELS.header.manualAction}
                    </Button>

                    <UserAccountMenu />
                </Stack>
            </Stack>

      <Menu
        {...scope}
        anchorEl={themeMenuAnchor}
        open={Boolean(themeMenuAnchor)}
        onClose={handleThemeMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { elevation: 0, className: styles.topGovMenuPaper } }}
      >
        <MenuItem
          selected={selectedThemeMode === 'light'}
          onClick={() => handleThemeModeSelect('light')}
          className={styles.topGovMenuItem}
        >
          밝은 테마
        </MenuItem>
        <MenuItem
          selected={selectedThemeMode === 'dark'}
          onClick={() => handleThemeModeSelect('dark')}
          className={styles.topGovMenuItem}
        >
          다크 테마
        </MenuItem>
      </Menu>

      <Menu
        {...scope}
        anchorEl={fontSizeMenuAnchor}
        open={Boolean(fontSizeMenuAnchor)}
        onClose={handleFontSizeMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { elevation: 0, className: styles.topGovMenuPaper } }}
      >
        {FONT_SIZE_OPTIONS.map((option) => {
          const isSelected = selectedFontSize.key === option.key;

          return (
            <MenuItem
              key={option.key}
              selected={isSelected}
              onClick={() => handleFontSizeSelect(option.key)}
              className={`${styles.topGovMenuItem} ${styles.topGovFontItem}`}
            >
              {option.label}
            </MenuItem>
          );
        })}

        <MenuItem
          onClick={handleFontSizeReset}
          className={styles.topGovMenuReset}
        >
          <RotateCcw size={20} />
          {APP_LABELS.header.fontSizeResetAction}
        </MenuItem>
      </Menu>
    </Box>
  );
}
