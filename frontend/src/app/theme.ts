import { createTheme, type ThemeOptions } from '@mui/material/styles';
import type {} from '@mui/x-data-grid/themeAugmentation';
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

// 테이블, 그리드 공통 스타일 값. 라이트와 다크 모드가 같은 값을 쓴다.
export const tableStyleTokens = {
  headerTopBorder: '2px solid #3263B9',
  headerBackground: '#EEF0F3',
  headerText: '#000',
  headerBottomBorder: '1px solid #D9DCE1',
  headerHeight: 40,
  rowBackground: '#FFFFFF',
  rowHoverBackground: '#F5F7FA',
  rowHeight: 47,
  bodyText: '#333333',
  borderColor: '#E5E7EB',
} as const;

// MUI Table 과 DataGrid 의 공통 스타일 정의. appTheme, darkTheme 이 함께 쓴다.
const tableComponents: ThemeOptions['components'] = {
  MuiTable: {
    styleOverrides: {
      root: {
        backgroundColor: tableStyleTokens.rowBackground,
        borderCollapse: 'separate',
        borderSpacing: 0,
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: tableStyleTokens.headerBackground,
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        backgroundColor: tableStyleTokens.rowBackground,
        // hover prop 행은 MUI 기본 선택자의 우선순위가 더 높아 함께 지정한다.
        '&:hover, &.MuiTableRow-hover:hover': {
          backgroundColor: tableStyleTokens.rowHoverBackground,
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        height: tableStyleTokens.headerHeight,
        borderTop: tableStyleTokens.headerTopBorder,
        borderBottom: tableStyleTokens.headerBottomBorder,
        fontWeight: 700,
        color: tableStyleTokens.headerText,
        backgroundColor: tableStyleTokens.headerBackground,
      },
      body: {
        height: tableStyleTokens.rowHeight,
        fontSize: 14,
        color: tableStyleTokens.bodyText,
        borderBottom: `1px solid ${tableStyleTokens.borderColor}`,
      },
    },
  },
  MuiDataGrid: {
    defaultProps: {
      rowHeight: tableStyleTokens.rowHeight,
      columnHeaderHeight: tableStyleTokens.headerHeight,
    },
    styleOverrides: {
      root: {
        '--DataGrid-rowBorderColor': tableStyleTokens.borderColor,
        // ponytail: 헤더가 항상 맨 위라 상단띠를 그리드 테두리로 처리, 헤더 높이 계산에 영향 없음
        border: `1px solid ${tableStyleTokens.borderColor}`,
        borderTop: tableStyleTokens.headerTopBorder,
        borderRadius: 0,
        backgroundColor: tableStyleTokens.rowBackground,
        color: tableStyleTokens.bodyText,
        fontSize: 14,
        '& .MuiDataGrid-columnHeader, & .MuiDataGrid-filler, & .MuiDataGrid-scrollbarFiller--header': {
          backgroundColor: tableStyleTokens.headerBackground,
          color: tableStyleTokens.headerText,
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 700,
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: tableStyleTokens.rowHoverBackground,
        },
      },
    },
  },
};

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2a5bb8',
      dark: '#1e3a6e',
      light: '#6b8fd6',
    },
    secondary: {
      main: '#3b82f6',
      dark: '#0f766e',
      light: '#99f6e4',
    },
    warning: {
      main: '#e57a22',
    },
    background: {
      default: 'rgba(245, 246, 248, 0.54)',
      paper: '#ffffff',
    },
  },
  ...sharedThemeOptions,
  components: tableComponents,
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
  components: tableComponents,
});

export function getThemeByMode(mode: ThemeModePreference) {
  return mode === 'dark' ? darkTheme : appTheme;
}
