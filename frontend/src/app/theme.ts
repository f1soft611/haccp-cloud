import { alpha, createTheme, type Palette, type ThemeOptions } from '@mui/material/styles';
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
    fontWeightRegular: 500,
  },
} as const;

// 테이블, 그리드 공통 스타일 값. 라이트와 다크 모드가 같은 값을 쓴다.
export const tableStyleTokens = {
  headerTopBorder: '2px solid #3263B9',
  headerBackground: '#EEF0F3',
  headerText: '#313439',
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
        textAlign: 'center',
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
        // 컬럼별 headerAlign 과 관계없이 헤더 제목을 가운데 정렬
        '& .MuiDataGrid-columnHeaderTitleContainer': {
          justifyContent: 'center',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: tableStyleTokens.rowHoverBackground,
        },
      },
    },
  },

  // lucide 아이콘은 width/height 속성(24)을 쓰므로, 버튼 아이콘 자리에서는 MUI 아이콘처럼 1em 으로 맞춘다
  MuiButton: {
    styleOverrides: {
      startIcon: { '& > svg.lucide': { width: '1em', height: '1em' } },
      endIcon: { '& > svg.lucide': { width: '1em', height: '1em' } },
      contained: {
        height: 35,
        minWidth: 82,
        borderRadius: 4,
        boxShadow: '0px 1px 1px #00000029',
      },
    },
  },
};

// 라이트, 다크가 같은 모양을 갖도록 의미 단위 색 토큰을 하나의 타입으로 정의한다
export type AppColorTokens = {
  surface: { subtle: string; outline: string; muted: string };
  panel: {
    border: string;
    background: string;
    shadow: string;
    iconBg: string;
    buttonShadow: string;
    emptyBorder: string;
    emptyBg: string;
    itemBorder: string;
    itemBg: string;
    itemHoverShadow: string;
    popoverShadow: string;
    replyBorder: string;
    lineBorder: string;
    signerBg: string;
  };
  nav: { accent: string; selectedBg: string; selectedText: string };
  workMenu: {
    barBorder: string;
    barBg: string;
    groupText: string;
    groupSelectedText: string;
    groupSelectedBg: string;
    groupSelectedHoverBg: string;
    groupHoverBg: string;
    panelBg: string;
    panelBorder: string;
    panelShadow: string;
    backdrop: string;
    itemText: string;
    itemDivider: string;
    itemActiveBg: string;
    itemHoverBg: string;
    iconColor: string;
    iconBg: string;
    titleUnderline: string;
  };
  dashboard: {
    cardBorder: string;
    cardBg: string;
    summaryBg: string;
    innerBorder: string;
    innerBg: string;
    quickMenuBg: string;
    quickMenuText: string;
  };
  editor: {
    canvas: string;
    text: string;
    tableBorder: string;
    tableHeaderBg: string;
    previewBg: string;
    toolbarBg: string;
    toolbarText: string;
    chipBorder: string;
    chipBg: string;
    chipText: string;
  };
};

declare module '@mui/material/styles' {
  interface Palette {
    surface: AppColorTokens['surface'];
    panel: AppColorTokens['panel'];
    nav: AppColorTokens['nav'];
    workMenu: AppColorTokens['workMenu'];
    dashboard: AppColorTokens['dashboard'];
    editor: AppColorTokens['editor'];
  }
  interface PaletteOptions {
    surface?: AppColorTokens['surface'];
    panel?: AppColorTokens['panel'];
    nav?: AppColorTokens['nav'];
    workMenu?: AppColorTokens['workMenu'];
    dashboard?: AppColorTokens['dashboard'];
    editor?: AppColorTokens['editor'];
  }
}

// 라이트 테마 색 토큰. 기본 palette 를 받아 기존 컴포넌트의 라이트 값을 그대로 계산한다
function buildLightTokens(p: Palette): AppColorTokens {
  return {
    surface: {
      subtle: p.grey[50],
      outline: 'rgba(148, 163, 184, 0.35)',
      muted: 'rgba(248, 250, 252, 0.9)',
    },
    panel: {
      border: alpha(p.primary.main, 0.14),
      background: `linear-gradient(155deg, ${alpha('#f8fafc', 0.96)} 0%, ${alpha('#f1f5f9', 0.9)} 100%)`,
      shadow: `0 16px 34px ${alpha('#0f172a', 0.08)}`,
      iconBg: alpha(p.info.main, 0.12),
      buttonShadow: `0 10px 20px ${alpha(p.primary.main, 0.26)}`,
      emptyBorder: alpha(p.primary.main, 0.24),
      emptyBg: alpha(p.common.white, 0.75),
      itemBorder: alpha(p.common.black, 0.08),
      itemBg: alpha(p.common.white, 0.88),
      itemHoverShadow: `0 10px 18px ${alpha('#0f172a', 0.08)}`,
      popoverShadow: '0 14px 28px rgba(15, 23, 42, 0.16)',
      replyBorder: alpha(p.info.main, 0.3),
      lineBorder: 'rgba(15, 23, 42, 0.12)',
      signerBg: 'rgba(248, 250, 252, 0.7)',
    },
    nav: {
      accent: '#1f4f8f',
      selectedBg: 'rgba(31, 79, 143, 0.08)',
      selectedText: '#184173',
    },
    workMenu: {
      barBorder: p.divider,
      barBg: p.common.white,
      groupText: p.text.secondary,
      groupSelectedText: '#184173',
      groupSelectedBg: '#e7edf5',
      groupSelectedHoverBg: '#dde6f2',
      groupHoverBg: 'rgba(15, 23, 42, 0.05)',
      panelBg: '#f8fafd',
      panelBorder: 'rgba(15, 23, 42, 0.14)',
      panelShadow: '0 10px 24px rgba(15, 23, 42, 0.10)',
      backdrop: 'rgba(15, 23, 42, 0.12)',
      itemText: p.text.primary,
      itemDivider: 'rgba(15, 23, 42, 0.16)',
      itemActiveBg: 'rgba(31, 79, 143, 0.08)',
      itemHoverBg: 'rgba(31, 79, 143, 0.12)',
      iconColor: '#1f4f8f',
      iconBg: 'rgba(31, 79, 143, 0.12)',
      titleUnderline: 'rgba(15, 23, 42, 0.20)',
    },
    dashboard: {
      cardBorder: 'rgba(20, 184, 166, 0.24)',
      cardBg: 'rgba(240, 253, 250, 0.9)',
      summaryBg: 'linear-gradient(135deg, rgba(15,118,110,0.1), rgba(20,184,166,0.04))',
      innerBorder: 'rgba(15, 23, 42, 0.12)',
      innerBg: 'rgba(255, 255, 255, 0.8)',
      quickMenuBg: '#eef7ff',
      quickMenuText: p.text.primary,
    },
    editor: {
      canvas: p.common.white,
      text: p.text.primary,
      tableBorder: p.divider,
      tableHeaderBg: p.common.white,
      previewBg: p.background.paper,
      toolbarBg: p.grey[50],
      toolbarText: p.text.primary,
      chipBorder: p.primary.main,
      chipBg: 'rgba(239, 246, 255, 0.95)',
      chipText: p.primary.dark,
    },
  };
}

// 다크 테마 색 토큰. 기본 palette 를 받아 기존 컴포넌트의 다크 값을 그대로 계산한다
function buildDarkTokens(p: Palette): AppColorTokens {
  return {
    surface: {
      subtle: 'rgba(255, 255, 255, 0.06)',
      outline: 'rgba(148, 163, 184, 0.3)',
      muted: 'rgba(148, 163, 184, 0.08)',
    },
    panel: {
      border: alpha(p.common.white, 0.12),
      background: `linear-gradient(155deg, ${alpha('#0f172a', 0.96)} 0%, ${alpha('#111827', 0.96)} 100%)`,
      shadow: `0 16px 36px ${alpha('#020617', 0.45)}`,
      iconBg: alpha(p.info.light, 0.14),
      buttonShadow: `0 8px 18px ${alpha(p.primary.dark, 0.45)}`,
      emptyBorder: alpha(p.common.white, 0.18),
      emptyBg: alpha(p.common.white, 0.02),
      itemBorder: alpha(p.common.white, 0.08),
      itemBg: alpha(p.common.white, 0.03),
      itemHoverShadow: `0 8px 16px ${alpha('#020617', 0.3)}`,
      popoverShadow: '0 14px 30px rgba(2, 6, 23, 0.45)',
      replyBorder: alpha(p.info.light, 0.35),
      lineBorder: 'rgba(148, 163, 184, 0.28)',
      signerBg: 'rgba(30, 41, 59, 0.35)',
    },
    nav: {
      accent: '#fbbf24',
      selectedBg: 'rgba(251, 191, 36, 0.14)',
      selectedText: '#fef3c7',
    },
    workMenu: {
      barBorder: 'rgba(251, 191, 36, 0.22)',
      barBg: '#111827',
      groupText: 'rgba(248, 250, 252, 0.76)',
      groupSelectedText: '#fef3c7',
      groupSelectedBg: 'rgba(251, 191, 36, 0.14)',
      groupSelectedHoverBg: 'rgba(251, 191, 36, 0.14)',
      groupHoverBg: 'rgba(251, 191, 36, 0.08)',
      panelBg: '#0f172a',
      panelBorder: 'rgba(251, 191, 36, 0.2)',
      panelShadow: '0 14px 30px rgba(2, 6, 23, 0.52)',
      backdrop: 'rgba(2, 6, 23, 0.48)',
      itemText: '#f8fafc',
      itemDivider: 'rgba(251, 191, 36, 0.16)',
      itemActiveBg: 'rgba(251, 191, 36, 0.14)',
      itemHoverBg: 'rgba(251, 191, 36, 0.08)',
      iconColor: '#fbbf24',
      iconBg: 'rgba(251, 191, 36, 0.12)',
      titleUnderline: 'rgba(251, 191, 36, 0.24)',
    },
    dashboard: {
      cardBorder: 'rgba(20, 184, 166, 0.4)',
      cardBg: 'rgba(6, 30, 28, 0.9)',
      summaryBg: 'linear-gradient(135deg, rgba(6, 78, 59, 0.35), rgba(15, 23, 42, 0.35))',
      innerBorder: 'rgba(148, 163, 184, 0.24)',
      innerBg: 'rgba(15, 23, 42, 0.88)',
      quickMenuBg: 'rgba(15, 23, 42, 0.82)',
      quickMenuText: '#e2e8f0',
    },
    editor: {
      canvas: '#f8fafc',
      text: '#0f172a',
      tableBorder: 'rgba(15, 23, 42, 0.35)',
      tableHeaderBg: '#eef2f7',
      previewBg: p.grey[900],
      toolbarBg: p.grey[900],
      toolbarText: p.grey[100],
      chipBorder: 'rgba(96, 165, 250, 0.45)',
      chipBg: 'rgba(30, 41, 59, 0.9)',
      chipText: '#e2e8f0',
    },
  };
}

const lightBase = createTheme({
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
      default: '#F5F6F8',
      paper: '#ffffff',
    },
  },
  ...sharedThemeOptions,
  components: tableComponents,
});

export const appTheme = createTheme(lightBase, {
  palette: buildLightTokens(lightBase.palette),
});

const darkBase = createTheme({
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

export const darkTheme = createTheme(darkBase, {
  palette: buildDarkTokens(darkBase.palette),
});

export function getThemeByMode(mode: ThemeModePreference) {
  return mode === 'dark' ? darkTheme : appTheme;
}
