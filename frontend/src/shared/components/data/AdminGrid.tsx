import { Table, TableContainer } from '@mui/material';
import Paper from '@mui/material/Paper';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { appTheme, tableStyleTokens } from '../../../app/theme';

// 기존 -> 민트색 테두리와 그림자, 다크모드 분기
// 변경 -> 연회색 테두리 고정, 그림자 없음
const CONTAINER_SX = {
  border: `1px solid ${tableStyleTokens.borderColor}`,
  borderRadius: 0,
  boxShadow: 'none',
  overflow: 'auto',
  bgcolor: tableStyleTokens.rowBackground,
};

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
      <TableContainer component={Paper} sx={{ ...CONTAINER_SX, maxHeight }}>
        {/* 기존 -> sx 로 헤더, 셀 색을 직접 지정 / 변경 -> theme.ts 공통 정의 사용 */}
        <Table
          size="small"
          stickyHeader
          aria-label={ariaLabel}
          sx={minWidth ? { minWidth } : undefined}
        >
          {children}
        </Table>
      </TableContainer>
    </ThemeProvider>
  );
}