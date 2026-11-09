

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

// 업무 카드 칩 공용 크기
// 기존 -> fontWeight 700 / 변경 -> 시안 500
export const CARD_CHIP_SX = { height: 24, fontWeight: 500, fontSize: 12 };

// 업무 카드 업무분류 글씨
export const WORK_CARD_CATEGORY_SX = { fontSize: 12, fontWeight: 400, color: '#8E8E8E' };

// 업무 카드 업무명 글씨
export const WORK_CARD_TITLE_SX = { fontSize: 17, fontWeight: 600, color: '#1E1F21' };

// 업무 카드 공용 스타일 (위 띠는 borderTop 으로 이 뒤에 지정해 덮어쓴다)
export const WORK_CARD_SX = {
  bgcolor: '#FFFFFF',
  border: '1px solid #EBEBEB',
  borderRadius: '6px',
  boxShadow: '1px 1px 5px #1A388A0A',
};

// 업무 카드 위 띠 색
export const DRAFT_CARD_TOP_COLOR = '#3263B9';
export const APPROVAL_CARD_TOP_COLOR = '#404244';

// 업무 카드 버튼 공용 색 (미작성건, 작성, 문서 열기)
export const WORK_CARD_BUTTON_SX = {
  color: '#29409A',
  bgcolor: '#F9FAFC',
  border: '1px solid #B4BDDF',
};

// D-day 칩 글자색: 지남은 빨강, 당일은 주황, 그 외는 시안 색
export function getDDayColor(dDay: string): string {
  if (dDay.startsWith('D+')) {
    return 'error.main';
  }
  return dDay === 'D-Day' ? 'warning.main' : '#555555';
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
