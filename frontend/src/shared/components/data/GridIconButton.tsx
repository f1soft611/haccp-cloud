import IconButton, { type IconButtonProps } from '@mui/material/IconButton';
import type { Theme } from '@mui/material/styles';

type GridIconButtonTone = 'default' | 'danger' | 'success' | 'document' | 'muted';

/** tone 별 [라이트, 다크] 색. danger, success, document, muted 는 각 그리드의 dangerIconSx, successIconSx, getDocumentIconSx 값 그대로. */
const TONES: Record<
  GridIconButtonTone,
  { color?: [string, string]; bg: [string, string]; hover: [string, string] }
> = {
  // ponytail: default 의 hover, 다크 색은 시안에 없어 임시값
  default: {
    bg: ['#EFF2F5', '#EFF2F5'],
    hover: ['#E2E7EC', '#E2E7EC'],
  },
  danger: {
    color: ['#c53b3b', '#f87171'],
    bg: ['rgba(197, 59, 59, 0.08)', 'rgba(248, 113, 113, 0.12)'],
    hover: ['rgba(197, 59, 59, 0.16)', 'rgba(248, 113, 113, 0.2)'],
  },
  success: {
    color: ['#2e7d32', '#86efac'],
    bg: ['rgba(46, 125, 50, 0.08)', 'rgba(134, 239, 172, 0.12)'],
    hover: ['rgba(46, 125, 50, 0.16)', 'rgba(134, 239, 172, 0.2)'],
  },
  // ponytail: document, muted 의 hover 는 원본에 없어 bg 보다 한 단계 진한 임시값
  document: {
    color: ['#0f172a', '#e2e8f0'],
    bg: ['rgba(15, 23, 42, 0.1)', 'rgba(226, 232, 240, 0.18)'],
    hover: ['rgba(15, 23, 42, 0.16)', 'rgba(226, 232, 240, 0.26)'],
  },
  muted: {
    color: ['#9ca3af', '#94a3b8'],
    bg: ['rgba(156, 163, 175, 0.16)', 'rgba(148, 163, 184, 0.16)'],
    hover: ['rgba(156, 163, 175, 0.24)', 'rgba(148, 163, 184, 0.24)'],
  },
};

type GridIconButtonProps = IconButtonProps & { tone?: GridIconButtonTone };

/** 데이터그리드 행 액션용 아이콘 버튼. 모양(35x35, 6px 라운드)은 고정. 기존 -> 색은 sx 로 덮어씀 / 변경 -> 색은 tone 프리셋으로 고름 */
export function GridIconButton({ tone = 'default', sx, ...props }: GridIconButtonProps) {
  const toneColors = TONES[tone];

  return (
    <IconButton
      size="small"
      {...props}
      sx={[
        (theme: Theme) => {
          // eslint-disable-next-line no-restricted-syntax -- tone 프리셋을 공용 컴포넌트 한 곳에서 고름
          const modeIndex = theme.palette.mode === 'dark' ? 1 : 0;
          return {
            width: 35,
            height: 35,
            borderRadius: '6px',
            color: toneColors.color?.[modeIndex],
            bgcolor: toneColors.bg[modeIndex],
            '&:hover': { bgcolor: toneColors.hover[modeIndex] },
          };
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}