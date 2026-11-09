import { Table, TableContainer } from '@mui/material';
import Paper from '@mui/material/Paper';
import { ThemeProvider } from '@mui/material/styles';
import type { CSSProperties, ReactNode } from 'react';
import { appTheme, tableStyleTokens } from '../../../app/theme';
import styles from '../sharedComponents.module.css';

export type AdminGridProps = {
  ariaLabel: string;
  children: ReactNode;
  maxHeight?: number;
  minWidth?: number;
};

// 목록 화면 공통 테이블. 다크모드에서도 흰 바탕이라 내부 팔레트 색이 흐려지지 않도록 appTheme 으로 감싼다.
export function AdminGrid({
  ariaLabel,
  children,
  maxHeight = 620,
  minWidth,
}: AdminGridProps) {
  return (
    <ThemeProvider theme={appTheme}>
      <TableContainer
        component={Paper}
        className={`${styles.scope} ${styles.adminGrid}`}
        style={{
          maxHeight,
          '--admin-grid-border': tableStyleTokens.borderColor,
          '--admin-grid-bg': tableStyleTokens.rowBackground,
        } as CSSProperties}
      >
        {/* 기존 -> sx 로 헤더, 셀 색을 직접 지정 / 변경 -> theme.ts 공통 정의 사용 */}
        <Table
          size="small"
          stickyHeader
          aria-label={ariaLabel}
          style={minWidth ? { minWidth } : undefined}
        >
          {children}
        </Table>
      </TableContainer>
    </ThemeProvider>
  );
}