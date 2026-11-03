import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
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
import { Link as RouterLink } from 'react-router-dom';
import { SIDE_NAV_WIDTH } from './SideNav';
import { useTheme } from '@mui/material/styles';
import { useAuthStore } from '../../store/authStore';
import { APP_LABELS } from '../../constants/labels';
import {
    getStoredThemeMode,
    storeThemeMode,
    type ThemeModePreference,
} from '../../theme/themePreference';
import { UserAccountMenu } from '../account/UserAccountMenu';
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

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

    const headerButtonSx = {
        borderRadius: 1,
        px: 1.5,
        py: 0.4,
        minHeight: 32,
        minWidth: 96,
        bgcolor: 'rgba(255,255,255,0.08)',
        borderColor: 'rgba(255,255,255,0.2)',
        color: '#f8fafc',
        fontWeight: 600,
        fontSize: '0.8125rem',
        '&:hover': {
            borderColor: isDarkMode ? '#fbbf24' : '#ffffff',
            bgcolor: 'rgba(255,255,255,0.14)',
        },
    } as const;

    const headerDropdownButtonSx = {
        ...headerButtonSx,
        minWidth: 96,
        justifyContent: 'space-between',
    } as const;

    return (
        <Box
            data-testid="top-gov-bar"
            sx={{
                bgcolor: isDarkMode ? '#111827' : '#1b2a4e',
                color: '#f8fafc',
                borderBottom: '1px solid',
                borderColor: isDarkMode ? 'rgba(251,191,36,0.28)' : '#1b2a4e',
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ pl: { xs: 1, md: 0 }, pr: { xs: 2, md: 3 }, minHeight: 48 }}
            >
                {onOpenMobileNav ? (
                    <IconButton
                        aria-label="메뉴 열기"
                        onClick={onOpenMobileNav}
                        sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'inherit' }}
                    >
                        <MenuRoundedIcon />
                    </IconButton>
                ) : null}

                <Box
                    sx={{
                        width: { md: SIDE_NAV_WIDTH },
                        flexShrink: 0,
                        px: { md: 3 },
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Link
                        component={RouterLink}
                        to="/"
                        underline="none"
                        aria-label="FoodLink 홈으로 이동"
                        sx={{
                            display: 'inline-flex',
                            borderRadius: 1,
                            '&:focus-visible': {
                                outline: '2px solid #ffffff',
                                outlineOffset: '2px',
                            },
                        }}
                    >
                        <Box
                            component="img"
                            src="/f1foodlink_wh.png"
                            alt="FoodLink"
                            sx={{ display: 'block', height: 22, objectFit: 'contain' }}
                        />
                    </Link>
                </Box>

                <Typography
                    variant="caption"
                    sx={{
                        flex: 1,
                        textAlign: 'center',
                        display: { xs: 'none', sm: 'block' },
                    }}
                >
                    {APP_LABELS.header.govNotice}
                </Typography>

                <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ ml: 'auto', py: 0.75 }}
                >
                    <Button
                        variant="outlined"
                        color="inherit"
                        startIcon={<SearchRoundedIcon fontSize="small" />}
                        aria-label={APP_LABELS.header.searchAction}
                        sx={{ ...headerButtonSx, display: 'none' }}
                    >
                        {APP_LABELS.header.searchAction}
                    </Button>

                    <Button
                        variant="outlined"
                        color="inherit"
                        aria-label="테마"
                        onClick={handleThemeMenuOpen}
                        endIcon={<KeyboardArrowDownRoundedIcon fontSize="small" />}
                        sx={headerDropdownButtonSx}
                    >
                        테마
                    </Button>

                    <Button
                        variant="outlined"
                        color="inherit"
                        aria-label={APP_LABELS.header.fontSizeAction}
                        onClick={handleFontSizeMenuOpen}
                        endIcon={<KeyboardArrowDownRoundedIcon fontSize="small" />}
                        sx={headerDropdownButtonSx}
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
                        sx={headerButtonSx}
                    >
                        {APP_LABELS.header.manualAction}
                    </Button>

                    <UserAccountMenu />
                </Stack>
            </Stack>

      <Menu
        anchorEl={themeMenuAnchor}
        open={Boolean(themeMenuAnchor)}
        onClose={handleThemeMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 0.8,
              border: '1px solid rgba(15,23,42,0.14)',
              borderRadius: 2,
              minWidth: 190,
              boxShadow: '0 14px 28px rgba(15,23,42,0.12)',
              p: 0.6,
            },
          },
        }}
      >
        <MenuItem
          selected={selectedThemeMode === 'light'}
          onClick={() => handleThemeModeSelect('light')}
          sx={{
            borderRadius: 1.5,
            minHeight: 38,
            fontWeight: selectedThemeMode === 'light' ? 700 : 500,
            color: selectedThemeMode === 'light' ? '#0f5f59' : 'text.primary',
          }}
        >
          밝은 테마
        </MenuItem>
        <MenuItem
          selected={selectedThemeMode === 'dark'}
          onClick={() => handleThemeModeSelect('dark')}
          sx={{
            borderRadius: 1.5,
            minHeight: 38,
            fontWeight: selectedThemeMode === 'dark' ? 700 : 500,
            color: selectedThemeMode === 'dark' ? '#0f5f59' : 'text.primary',
          }}
        >
          다크 테마
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={fontSizeMenuAnchor}
        open={Boolean(fontSizeMenuAnchor)}
        onClose={handleFontSizeMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 0.8,
              border: '1px solid rgba(15,23,42,0.14)',
              borderRadius: 2,
              minWidth: 190,
              boxShadow: '0 14px 28px rgba(15,23,42,0.12)',
              p: 0.6,
            },
          },
        }}
      >
        {FONT_SIZE_OPTIONS.map((option) => {
          const isSelected = selectedFontSize.key === option.key;

          return (
            <MenuItem
              key={option.key}
              selected={isSelected}
              onClick={() => handleFontSizeSelect(option.key)}
              sx={{
                borderRadius: 1.5,
                minHeight: 38,
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? '#0f5f59' : 'text.primary',
                '&.Mui-selected': {
                  bgcolor: 'rgba(20,184,166,0.14)',
                },
                '&.Mui-selected:hover': {
                  bgcolor: 'rgba(20,184,166,0.2)',
                },
              }}
            >
              {option.label}
            </MenuItem>
          );
        })}

        <MenuItem
          onClick={handleFontSizeReset}
          sx={{
            borderRadius: 1.5,
            mt: 0.2,
            borderTop: '1px solid rgba(15,23,42,0.12)',
            gap: 0.8,
            color: 'text.secondary',
            minHeight: 40,
          }}
        >
          <RestartAltRoundedIcon fontSize="small" />
          {APP_LABELS.header.fontSizeResetAction}
        </MenuItem>
      </Menu>
    </Box>
  );
}
