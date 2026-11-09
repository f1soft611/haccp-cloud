import { alpha, type Theme } from '@mui/material/styles';
import type { CSSProperties } from 'react';

const WORK_CYCLE_COLORS: Record<string, { border: string; color: string }> = {
  DAY: { border: '#00B718', color: '#00B718' },
  WEEK: { border: '#2089F3', color: '#2066F3' },
  MONTH: { border: '#6D30FF', color: '#6E31FF' },
  ANYTIME: { border: '#6E6E6E', color: '#3B3B3B' },
};
const WORK_CYCLE_DEFAULT_COLOR = { border: '#929FBC', color: '#596785' };

// 주기 칩 공용 스타일 (크기, 글자, 모서리, 패딩, 색상)
export function getWorkCycleSx(cycle: string) {
  const { border, color } = WORK_CYCLE_COLORS[cycle] ?? WORK_CYCLE_DEFAULT_COLOR;
  return {
    height: 24,
    borderRadius: '17px',
    fontSize: 12,
    fontWeight: 700,
    bgcolor: '#FFFFFF',
    color,
    border: `1px solid ${border}`,
    '& .MuiChip-label': { px: '9px' },
  };
}

// 선택된 범례 강조 (주기 칩, 상태 배지 공용)
export const SELECTED_LEGEND_SX = {
  outline: '2px solid',
  outlineColor: 'text.primary',
  outlineOffset: 1,
};

// D-day 칩의 CSS 클래스 이름: 지남, 당일, 그 외
export function getDDayTone(dDay: string): 'overdue' | 'today' | 'normal' {
  if (dDay.startsWith('D+')) {
    return 'overdue';
  }
  return dDay === 'D-Day' ? 'today' : 'normal';
}

// CSS 파일에서 읽을 테마 값을 대시보드 최상위 요소의 CSS 변수로 넘긴다
export function getDashboardCssVars(theme: Theme) {
  return {
    '--dashboard-paper': theme.palette.background.paper,
    '--dashboard-divider': theme.palette.divider,
    '--dashboard-text-primary': theme.palette.text.primary,
    '--dashboard-text-secondary': theme.palette.text.secondary,
    '--dashboard-text-disabled': theme.palette.text.disabled,
    '--dashboard-action-hover': theme.palette.action.hover,
    '--dashboard-primary': theme.palette.primary.main,
    '--dashboard-error': theme.palette.error.main,
    '--dashboard-warning': theme.palette.warning.main,
    '--dashboard-primary-hover': alpha(theme.palette.primary.main, theme.palette.action.hoverOpacity),
  } as CSSProperties;
}

export function formatDate(value: string): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
