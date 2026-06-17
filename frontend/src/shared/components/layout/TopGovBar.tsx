import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TextFieldsRoundedIcon from '@mui/icons-material/TextFieldsRounded';
import {
  Box,
  Button,
  Container,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { logout as logoutApi } from '../../../services/auth/logoutService';
import { useAuthStore } from '../../store/authStore';
import { APP_LABELS } from '../../constants/labels';

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

export function TopGovBar() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  const loginHistoryId = useAuthStore((state) => state.loginHistoryId);
  const clearAuth = useAuthStore((state) => state.logout);
  const [fontSizeMenuAnchor, setFontSizeMenuAnchor] =
    useState<null | HTMLElement>(null);
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

  const handleLogout = async () => {
    try {
      await logoutApi(loginHistoryId);
    } catch {
      // Force local logout even if backend call fails.
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  const handleFontSizeMenuOpen = (event: MouseEvent<HTMLElement>) => {
    setFontSizeMenuAnchor(event.currentTarget);
  };

  const handleFontSizeMenuClose = () => {
    setFontSizeMenuAnchor(null);
  };

  const handleFontSizeSelect = (fontSizeKey: FontSizeOptionKey) => {
    setSelectedFontSizeKey(fontSizeKey);
    handleFontSizeMenuClose();
  };

  const handleFontSizeReset = () => {
    setSelectedFontSizeKey('NORMAL');
    handleFontSizeMenuClose();
  };

  return (
    <Box
      data-testid="top-gov-bar"
      sx={{
        bgcolor: 'common.white',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          bgcolor: '#EEF4FB',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container sx={{ py: 0.75 }}>
          <Typography
            variant="caption"
            sx={{ display: 'block', textAlign: 'left' }}
          >
            {APP_LABELS.header.govNotice}
          </Typography>
        </Container>
      </Box>

      <Container>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'stretch', md: 'center' }}
          justifyContent="space-between"
          spacing={{ xs: 1.1, md: 0 }}
          sx={{ py: 1.25 }}
        >
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ letterSpacing: 0.2, textAlign: 'left' }}
          >
            {APP_LABELS.appTitle} {APP_LABELS.appSubtitle}
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            justifyContent={{ xs: 'flex-start', md: 'flex-end' }}
            spacing={1}
            sx={{ flexWrap: 'wrap' }}
          >
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<SearchRoundedIcon fontSize="small" />}
              aria-label={APP_LABELS.header.searchAction}
              sx={{
                borderRadius: 999,
                px: 1.5,
                py: 0.45,
                minHeight: 34,
                borderColor: 'rgba(15,23,42,0.2)',
                color: '#0f172a',
                fontWeight: 700,
                '&:hover': {
                  borderColor: '#1f4f8f',
                  bgcolor: 'rgba(31,79,143,0.05)',
                },
              }}
            >
              {APP_LABELS.header.searchAction}
            </Button>

            <Button
              variant="outlined"
              color="inherit"
              aria-label={APP_LABELS.header.fontSizeAction}
              onClick={handleFontSizeMenuOpen}
              startIcon={<TextFieldsRoundedIcon fontSize="small" />}
              endIcon={<KeyboardArrowDownRoundedIcon fontSize="small" />}
              sx={{
                borderRadius: 999,
                px: 1.4,
                py: 0.45,
                minHeight: 34,
                borderColor: 'rgba(15,23,42,0.2)',
                color: '#0f172a',
                fontWeight: 700,
                '&:hover': {
                  borderColor: '#1f4f8f',
                  bgcolor: 'rgba(31,79,143,0.05)',
                },
              }}
            >
              {APP_LABELS.header.fontSizeAction}
            </Button>

            {isAuthenticated && role !== 'PLATFORM_ADMIN' ? (
              <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                  void handleLogout();
                }}
                sx={{ minWidth: 96, fontWeight: 700, borderRadius: 999 }}
              >
                {APP_LABELS.action.logout}
              </Button>
            ) : null}
          </Stack>
        </Stack>
      </Container>

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
                color: isSelected ? '#0f2942' : 'text.primary',
                '&.Mui-selected': {
                  bgcolor: 'rgba(31,79,143,0.14)',
                },
                '&.Mui-selected:hover': {
                  bgcolor: 'rgba(31,79,143,0.2)',
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
