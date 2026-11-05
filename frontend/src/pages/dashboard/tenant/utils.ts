const WORK_CYCLE_COLORS: Record<string, { border: string; color: string }> = {
  DAY: { border: '#00B76E', color: '#00B76E' },
  WEEK: { border: '#0094D5', color: '#0094D5' },
  MONTH: { border: '#6D30FF', color: '#6E31FF' },
  ANYTIME: { border: '#3B3B3B', color: '#3B3B3B' },
};
const WORK_CYCLE_DEFAULT_COLOR = { border: '#929FBC', color: '#596785' };

export function getWorkCycleSx(cycle: string) {
  const { border, color } = WORK_CYCLE_COLORS[cycle] ?? WORK_CYCLE_DEFAULT_COLOR;
  return {
    bgcolor: '#FFFFFF',
    color,
    border: `1px solid ${border}`,
  };
}

// 캘린더 이벤트용: 칩과 같은 색, 기존 캘린더 모양(연한 배경 + 옅은 테두리)
export function getWorkCycleEventSx(cycle: string) {
  const { border, color } = WORK_CYCLE_COLORS[cycle] ?? WORK_CYCLE_DEFAULT_COLOR;
  return {
    bgcolor: `${border}1F`,
    color,
    border: `1px solid ${border}47`,
  };
}

// 선택된 범례 강조 (주기 칩, 상태 배지 공용)
export const SELECTED_LEGEND_SX = {
  outline: '2px solid',
  outlineColor: 'text.primary',
  outlineOffset: 1,
};

// 업무 카드 칩 공용 크기
export const CARD_CHIP_SX = { height: 22, fontWeight: 700, fontSize: 12 };

// D-day 칩 글자색: 지남은 빨강, 당일은 주황, 그 외는 회색
export function getDDayColor(dDay: string): string {
  if (dDay.startsWith('D+')) {
    return 'error.main';
  }
  return dDay === 'D-Day' ? 'warning.main' : 'text.secondary';
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
