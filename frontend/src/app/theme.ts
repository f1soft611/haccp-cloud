import { createTheme } from '@mui/material/styles';
import type { ThemeModePreference } from '../shared/theme/themePreference';

export const dashboardThemeTokens = {
  heroGradientFrom: '#0f766e',
  heroGradientMid: '#0f9a8b',
  heroGradientTo: '#2dd4bf',
  sectionHeaderFrom: '#0f766e',
  sectionHeaderTo: '#14b8a6',
  heroChipBg: 'rgba(255,255,255,0.24)',
  sectionCountChipBg: 'rgba(255,255,255,0.24)',
  sectionSurface: '#f0fdfa',
  rowNumber: '#0f766e',
  panelBorder: 'rgba(15,118,110,0.22)',
  filterChipBorder: 'rgba(20,184,166,0.34)',
  filterChipText: '#0f5f59',
  statusAttention: '#e57a22',
  statusGood: '#178a7e',
} as const;

const sharedThemeOptions = {
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: [
      'Pretendard',
      'Apple SD Gothic Neo',
      'Noto Sans KR',
      'Segoe UI',
      'sans-serif',
    ].join(','),
  },
} as const;

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f766e',
      dark: '#115e59',
      light: '#2dd4bf',
    },
    secondary: {
      main: '#14b8a6',
      dark: '#0f766e',
      light: '#99f6e4',
    },
    warning: {
      main: '#e57a22',
    },
    background: {
      default: '#ecfdf5',
      paper: '#ffffff',
    },
  },
  ...sharedThemeOptions,
  components: {
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#d7ecea',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          '&:hover': {
            backgroundColor: '#f0fdfa',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          borderBottom: '1px solid rgba(66, 111, 106, 0.28)',
          fontWeight: 700,
          color: '#2f5f5b',
          backgroundColor: '#d7ecea',
        },
        body: {
          borderBottom: '1px solid rgba(15, 118, 110, 0.12)',
        },
      },
    },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#fbbf24',
      dark: '#f59e0b',
      light: '#fde68a',
      contrastText: '#1f2937',
    },
    secondary: {
      main: '#f97316',
      dark: '#c2410c',
      light: '#fdba74',
    },
    warning: {
      main: '#f59e0b',
    },
    background: {
      default: '#0b1220',
      paper: '#111827',
    },
  },
  ...sharedThemeOptions,
  components: {
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: '#111827',
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: '#172131',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          backgroundColor: '#111827',
          '&:hover': {
            backgroundColor: '#1b2535',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          borderBottom: '1px solid rgba(251, 191, 36, 0.28)',
          fontWeight: 700,
          color: '#fef3c7',
          backgroundColor: '#172131',
        },
        body: {
          borderBottom: '1px solid rgba(148, 163, 184, 0.22)',
        },
      },
    },
  },
});

export function getThemeByMode(mode: ThemeModePreference) {
  return mode === 'dark' ? darkTheme : appTheme;
}
