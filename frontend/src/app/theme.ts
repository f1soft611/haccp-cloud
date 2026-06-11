import { createTheme } from '@mui/material/styles';

export const dashboardThemeTokens = {
  heroGradientFrom: '#1f4f8f',
  heroGradientMid: '#2169a7',
  heroGradientTo: '#178a7e',
  sectionHeaderFrom: '#1f4f8f',
  sectionHeaderTo: '#2f78af',
  heroChipBg: 'rgba(255,255,255,0.24)',
  sectionCountChipBg: 'rgba(255,255,255,0.24)',
  sectionSurface: '#f4f8fb',
  rowNumber: '#1f4f8f',
  panelBorder: 'rgba(31,79,143,0.2)',
  filterChipBorder: 'rgba(31,79,143,0.34)',
  filterChipText: '#214f83',
  statusAttention: '#e57a22',
  statusGood: '#178a7e',
} as const;

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1f4f8f',
      dark: '#163b6d',
      light: '#3b76b8',
    },
    secondary: {
      main: '#178a7e',
      dark: '#10665c',
      light: '#38a89a',
    },
    warning: {
      main: '#e57a22',
    },
    background: {
      default: '#f1f6fc',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 10,
  },
});
