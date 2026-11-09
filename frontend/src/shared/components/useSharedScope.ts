import { useTheme, type Theme } from '@mui/material/styles';
import type { CSSProperties } from 'react';
import styles from './sharedComponents.module.css';

// CSS 파일에서 읽을 테마 값을 CSS 변수로 만든다
function getSharedCssVars(theme: Theme) {
  return {
    '--shared-white': theme.palette.common.white,
    '--shared-paper': theme.palette.background.paper,
    '--shared-divider': theme.palette.divider,
    '--shared-primary': theme.palette.primary.main,
    '--shared-text-primary': theme.palette.text.primary,
    '--shared-text-secondary': theme.palette.text.secondary,
    '--shared-text-disabled': theme.palette.text.disabled,
  } as CSSProperties;
}

// 공용 컴포넌트 최상위 요소에 지정할 범위 클래스, 모드, 테마 CSS 변수를 돌려준다
export function useSharedScope() {
  const theme = useTheme();

  return {
    className: styles.scope,
    'data-mode': theme.palette.mode,
    style: getSharedCssVars(theme),
  };
}