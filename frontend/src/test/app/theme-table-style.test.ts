import { describe, expect, it } from 'vitest';
import { appTheme, darkTheme, tableStyleTokens } from '../../app/theme';

describe('테이블, 그리드 공통 스타일', () => {
  it('헤더 값이 스펙과 일치한다', () => {
    expect(tableStyleTokens.headerTopBorder).toBe('2px solid #3263B9');
    expect(tableStyleTokens.headerBackground).toBe('#EEF0F3');
    expect(tableStyleTokens.headerText).toBe('#000');
  });

  it('라이트와 다크 테마가 같은 테이블 스타일을 쓴다', () => {
    const tableKeys = ['MuiTable', 'MuiTableHead', 'MuiTableRow', 'MuiTableCell', 'MuiDataGrid'] as const;

    tableKeys.forEach((key) => {
      expect(appTheme.components?.[key]).toBeDefined();
      expect(darkTheme.components?.[key]).toEqual(appTheme.components?.[key]);
    });
  });

  it('DataGrid 행과 헤더 높이가 Table 과 같다', () => {
    expect(appTheme.components?.MuiDataGrid?.defaultProps).toMatchObject({
      rowHeight: tableStyleTokens.rowHeight,
      columnHeaderHeight: tableStyleTokens.headerHeight,
    });
  });
});